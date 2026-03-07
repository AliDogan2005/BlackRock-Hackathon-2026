import { getPersistedToken } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function requestJson(path, options = {}) {
  const token = getPersistedToken();
  if (!token) {
    throw new Error("No active session found. Please login again.");
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed (${response.status}) for ${path}`);
  }

  return payload;
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveShare(shares, regionId, regionName) {
  const safeShares = Array.isArray(shares) ? shares : [];
  if (!safeShares.length) {
    return null;
  }

  const regionIdText = String(regionId ?? "").trim();
  const regionNameText = String(regionName || "").trim();

  if (/^\d+$/.test(regionIdText)) {
    const numericId = Number(regionIdText);
    const byId = safeShares.find((share) => Number(share?.id) === numericId);
    if (byId) {
      return byId;
    }
  }

  const wanted = normalizeName(regionNameText || regionIdText);
  if (!wanted) {
    return null;
  }

  const exact = safeShares.find((share) => normalizeName(share?.name) === wanted);
  if (exact) {
    return exact;
  }

  return safeShares.find((share) => normalizeName(share?.name).includes(wanted)) || null;
}

export async function buyTokensForRegion({ regionId, regionName, tokenAmount }) {
  const amount = Math.floor(toNumber(tokenAmount, 0));
  if (amount <= 0) {
    throw new Error("Token amount must be greater than 0.");
  }

  const shares = await requestJson("/api/shares", { method: "GET" });
  const share = resolveShare(shares, regionId, regionName);

  if (!share?.id) {
    throw new Error(`No active share found for ${regionName || regionId || "selected region"}.`);
  }

  const response = await requestJson(`/api/shares/${share.id}/buy`, {
    method: "POST",
    body: JSON.stringify({
      shareId: Number(share.id),
      tokenAmount: amount,
    }),
  });

  const unitPrice = toNumber(share?.currentValue, 0);

  return {
    type: "Buy",
    asset: response?.data?.shareName || share?.name || regionName || "Unknown Asset",
    tokenAmount: amount,
    amount: Number((unitPrice * amount).toFixed(2)),
    date: new Date().toISOString().slice(0, 10),
    message: response?.message || "Buy order completed.",
  };
}

export async function sellTokensForRegion({ regionId, regionName, tokenAmount }) {
  const amount = Math.floor(toNumber(tokenAmount, 0));
  if (amount <= 0) {
    throw new Error("Token amount must be greater than 0.");
  }

  const [shares, userTokens] = await Promise.all([
    requestJson("/api/shares", { method: "GET" }),
    requestJson("/api/shares/user/my-tokens", { method: "GET" }),
  ]);

  const share = resolveShare(shares, regionId, regionName);
  if (!share?.id) {
    throw new Error(`No active share found for ${regionName || regionId || "selected region"}.`);
  }

  const tokens = Array.isArray(userTokens) ? userTokens : [];
  const matchingToken = tokens.find((row) => Number(row?.shareId) === Number(share.id))
    || tokens.find((row) => normalizeName(row?.shareName) === normalizeName(share?.name));

  if (!matchingToken?.id) {
    throw new Error(`No owned tokens found for ${share?.name}.`);
  }

  if (toNumber(matchingToken?.tokenAmount, 0) < amount) {
    throw new Error(`Not enough token balance to sell ${amount}.`);
  }

  await requestJson(`/api/shares/tokens/${matchingToken.id}/sell?tokenAmount=${amount}`, {
    method: "DELETE",
  });

  const unitPrice = toNumber(share?.currentValue, 0);

  return {
    type: "Sell",
    asset: matchingToken?.shareName || share?.name || regionName || "Unknown Asset",
    tokenAmount: amount,
    amount: Number((unitPrice * amount).toFixed(2)),
    date: new Date().toISOString().slice(0, 10),
    message: "Sell order completed.",
  };
}
