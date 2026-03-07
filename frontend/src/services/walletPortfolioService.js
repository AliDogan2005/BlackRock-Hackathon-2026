import { getPersistedToken, getPersistedUser } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const ALLOCATION_COLORS = ["#1A120B", "#D4AF37", "#B8AA8A", "#7A6B4D", "#D9C58A"];

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function requestJson(path, token, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    const message = payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

function buildAllocation(positions, availableCash, totalAssetValue) {
  const rows = [];

  positions.forEach((position, index) => {
    const percent = totalAssetValue > 0 ? (position.value / totalAssetValue) * 100 : 0;
    rows.push({
      name: position.asset,
      value: Number(percent.toFixed(1)),
      color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
    });
  });

  const cashPercent = totalAssetValue > 0 ? (availableCash / totalAssetValue) * 100 : 0;
  rows.push({
    name: "Cash",
    value: Number(cashPercent.toFixed(1)),
    color: ALLOCATION_COLORS[2],
  });

  return rows.filter((row) => row.value > 0);
}

function buildTransactions(positions) {
  return positions
    .slice()
    .sort((a, b) => new Date(b.purchasedAt || 0).getTime() - new Date(a.purchasedAt || 0).getTime())
    .slice(0, 5)
    .map((position) => ({
      type: "Buy",
      asset: position.asset,
      amount: position.value,
      date: position.purchasedAt ? String(position.purchasedAt).slice(0, 10) : "-",
    }));
}

function toDisplayType(type) {
  const normalized = String(type || "").trim().toUpperCase();
  if (!normalized) {
    return "Transaction";
  }

  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function mapTransactionHistory(rows) {
  const list = Array.isArray(rows) ? rows : [];

  return list.slice(0, 12).map((row) => ({
    type: toDisplayType(row?.type),
    asset: row?.shareName || "Cash",
    amount: Math.abs(toNumber(row?.amount, 0)),
    date: row?.transactionDate ? String(row.transactionDate).slice(0, 10) : "-",
  }));
}

export async function fetchWalletPortfolioData() {
  const token = getPersistedToken();
  const user = getPersistedUser();

  if (!token || !user?.userId) {
    return null;
  }

  const [balancePayload, portfolioPayload, transactionPayload] = await Promise.all([
    requestJson("/api/wallet/balance", token),
    requestJson(`/api/users/${user.userId}/portfolio`, token).catch(() => []),
    requestJson("/api/transactions/my-history", token).catch(() => []),
  ]);

  const availableCash = toNumber(balancePayload?.balance, 0);

  const positions = Array.isArray(portfolioPayload)
    ? portfolioPayload.map((row) => ({
        asset: row.shareName || "Unknown Asset",
        value: toNumber(row.currentValue, 0),
        ownershipPercentage: toNumber(row.ownershipPercentage, 0),
        purchasedAt: row.purchasedAt,
      }))
    : [];

  const tokenValue = positions.reduce((sum, row) => sum + row.value, 0);
  const totalAssetValue = availableCash + tokenValue;

  const avgOwnership = positions.length
    ? positions.reduce((sum, row) => sum + row.ownershipPercentage, 0) / positions.length
    : 8;
  const profitLossPct = Number(clamp((avgOwnership - 6) / 2.1, -18, 24).toFixed(1));
  const valueChange = Number((totalAssetValue * (profitLossPct / 100)).toFixed(0));

  const backendTransactions = mapTransactionHistory(transactionPayload);
  const transactionsSource = backendTransactions.length ? "backend-history" : "portfolio-fallback";

  return {
    availableCash,
    tokenValue,
    totalAssetValue,
    profitLossPct,
    valueChange,
    allocation: buildAllocation(positions, availableCash, totalAssetValue),
    transactions: backendTransactions.length ? backendTransactions : buildTransactions(positions),
    transactionsSource,
  };
}

export async function depositToWallet(amount) {
  const token = getPersistedToken();

  if (!token) {
    throw new Error("No auth token available for deposit.");
  }

  return requestJson("/api/wallet/deposit", token, {
    method: "POST",
    body: JSON.stringify({
      amount,
      paymentMethod: "MOCK",
    }),
  });
}
