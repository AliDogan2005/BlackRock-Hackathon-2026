import { getPersistedToken, getPersistedUser } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function request(path, token, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  return response;
}

async function requestJson(path, token, options = {}) {
  const response = await request(path, token, options);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`);
  }

  return response.json();
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildAssetsFromShares(shares, limit = Infinity) {
  return (shares || []).slice(0, limit).map((share, index) => {
    const totalTokens = toNumber(share.totalTokens, 1);
    const availableTokens = toNumber(share.availableTokens, totalTokens);
    const utilization = totalTokens > 0 ? (totalTokens - availableTokens) / totalTokens : 0;
    const riskScore = clamp(Math.round(35 + utilization * 45), 20, 95);
    const price = toNumber(share.currentValue, 1);
    const direction = index % 3 === 0 ? -1 : 1;
    const change24h = Number((direction * (1.1 + utilization * 4.2)).toFixed(1));

    return {
      id: `fav-${share.id}`,
      regionId: share.id,
      name: share.name,
      region: share.name,
      price,
      change24h,
      riskScore,
      sparkline: [
        Math.max(8, riskScore - 10),
        Math.max(10, riskScore - 6),
        Math.max(12, riskScore - 4),
        Math.max(14, riskScore - 2),
        riskScore,
        Math.min(99, riskScore + (direction > 0 ? 2 : -1)),
      ],
    };
  });
}

function buildFavoritesFromShares(shares) {
  return buildAssetsFromShares(shares, 6);
}

export function mapShareToFavoriteAsset(share, index = 0) {
  if (!share || typeof share !== "object") {
    return null;
  }

  if (share.regionId !== undefined && share.price !== undefined) {
    const price = toNumber(share.price, 1);
    const riskScore = clamp(Math.round(toNumber(share.riskScore, 50)), 20, 95);
    const change24h = Number(toNumber(share.change24h, 0).toFixed(1));

    return {
      id: share.id || `fav-${share.regionId ?? index}`,
      regionId: share.regionId,
      name: share.name || share.region || `Asset ${index + 1}`,
      region: share.region || share.name || `Asset ${index + 1}`,
      price,
      change24h,
      riskScore,
      sparkline: Array.isArray(share.sparkline) && share.sparkline.length
        ? share.sparkline
        : [
            Math.max(8, riskScore - 10),
            Math.max(10, riskScore - 6),
            Math.max(12, riskScore - 4),
            Math.max(14, riskScore - 2),
            riskScore,
            Math.min(99, riskScore + (change24h >= 0 ? 2 : -1)),
          ],
    };
  }

  const mapped = buildAssetsFromShares([share], 1)[0] || null;
  if (!mapped) {
    return null;
  }

  return {
    ...mapped,
    sparkline: mapped.sparkline?.length
      ? mapped.sparkline
      : [42, 44, 46, 48, 50, 52].map((value, idx) => value + Math.max(0, index - idx)),
  };
}

export async function fetchUserFavoriteShares() {
  const token = getPersistedToken();
  const user = getPersistedUser();

  if (!token || !user?.userId) {
    return [];
  }

  const payload = await requestJson("/api/shares/user/favorites", token).catch(() => []);
  const safe = Array.isArray(payload) ? payload : [];

  return safe
    .map((share, index) => mapShareToFavoriteAsset(share, index))
    .filter(Boolean);
}

export async function addShareToFavorites(shareId) {
  const token = getPersistedToken();
  if (!token) {
    throw new Error("No active session found. Please login again.");
  }

  const response = await request(`/api/shares/${shareId}/favorite`, token, {
    method: "POST",
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    throw new Error(payload?.message || "Could not add favorite.");
  }

  try {
    return await response.json();
  } catch {
    return { message: "Share added to favorites successfully" };
  }
}

export async function removeShareFromFavorites(shareId) {
  const token = getPersistedToken();
  if (!token) {
    throw new Error("No active session found. Please login again.");
  }

  const response = await request(`/api/shares/${shareId}/favorite`, token, {
    method: "DELETE",
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    throw new Error(payload?.message || "Could not remove favorite.");
  }

  try {
    return await response.json();
  } catch {
    return { message: "Share removed from favorites successfully" };
  }
}

export async function fetchExplorerDashboardData() {
  const persistedUser = getPersistedUser();
  const token = getPersistedToken();

  const shares = await requestJson("/api/shares", token);

  let portfolio = [];
  if (persistedUser?.userId) {
    try {
      portfolio = await requestJson(`/api/users/${persistedUser.userId}/portfolio`, token);
    } catch {
      portfolio = [];
    }
  }

  const safeShares = Array.isArray(shares) ? shares : [];
  const safePortfolio = Array.isArray(portfolio) ? portfolio : [];

  const topShare = safeShares[0] || null;
  const topPortfolio = safePortfolio[0] || null;
  const totalShares = safeShares.length;

  const utilizedCount = safeShares.filter((share) => {
    const total = toNumber(share.totalTokens, 0);
    const available = toNumber(share.availableTokens, total);
    return total > 0 && available / total < 0.5;
  }).length;

  const bullishRatio = totalShares > 0 ? utilizedCount / totalShares : 0.68;
  const bullish = clamp(Math.round(bullishRatio * 100), 10, 95);
  const bearish = clamp(100 - bullish, 5, 90);

  const shareTotalTokens = toNumber(topShare?.totalTokens, 1);
  const shareAvailableTokens = toNumber(topShare?.availableTokens, shareTotalTokens);
  const utilization = shareTotalTokens > 0 ? (shareTotalTokens - shareAvailableTokens) / shareTotalTokens : 0.4;

  const ownershipProgress = clamp(
    Math.round(toNumber(topPortfolio?.ownershipPercentage, utilization * 100)),
    0,
    100
  );

  const roiProjection = Number((utilization * 12 - 2).toFixed(1));

  return {
    user: {
      address: topShare?.name ? `${topShare.name} Market Desk` : "Global Market Desk",
    },
    marketPulse: {
      region: topShare?.name || "Global Portfolio",
      tokenPrice: toNumber(topShare?.currentValue, 1.5),
      riskScore: clamp(Math.round(35 + utilization * 45), 20, 95),
      roiProjection,
    },
    sentiment: {
      bullish,
      bearish,
    },
    ownership: {
      progress: ownershipProgress,
      tokenName: topPortfolio?.shareName || topShare?.name || "NEXUS-CORE",
    },
    favorites: buildFavoritesFromShares(safeShares),
    allShares: buildAssetsFromShares(safeShares),
  };
}
