import { getPersistedToken, getPersistedUser } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function requestJson(path, token) {
  const response = await fetch(buildUrl(path), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

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

function buildFavoritesFromShares(shares) {
  return (shares || []).slice(0, 6).map((share, index) => {
    const totalTokens = toNumber(share.totalTokens, 1);
    const availableTokens = toNumber(share.availableTokens, totalTokens);
    const utilization = totalTokens > 0 ? (totalTokens - availableTokens) / totalTokens : 0;
    const riskScore = clamp(Math.round(35 + utilization * 45), 20, 95);
    const price = toNumber(share.currentValue, 1);
    const direction = index % 3 === 0 ? -1 : 1;
    const change24h = Number((direction * (1.1 + utilization * 4.2)).toFixed(1));

    return {
      id: `fav-${share.id}`,
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
  };
}
