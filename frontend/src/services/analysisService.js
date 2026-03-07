import { getPersistedToken, getPersistedUser } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function buildSummary(assets, riskScore) {
  if (!assets.length) {
    return "AI Analysis: Portfolio positions are limited right now. Add exposure to diversified regions to produce stronger predictive confidence and reduce volatility concentration.";
  }

  const best = assets[0];
  const lagging = assets[assets.length - 1];
  const riskTone = riskScore <= 40 ? "defensive posture is strong" : riskScore <= 70 ? "risk posture is balanced" : "risk posture is elevated";

  return `AI Analysis: ${best.name} is leading performance with ${best.profitLoss >= 0 ? "+" : ""}${best.profitLoss}% momentum. ${lagging.name} remains the main drag point. Portfolio ${riskTone}; consider gradual rebalancing toward higher-liquidity assets to improve downside resilience.`;
}

export async function fetchPersonalizedAnalysisData() {
  const token = getPersistedToken();
  const user = getPersistedUser();

  if (!token || !user?.userId) {
    return null;
  }

  const portfolio = await requestJson(`/api/users/${user.userId}/portfolio`, token);
  const rows = Array.isArray(portfolio) ? portfolio : [];

  const assets = rows
    .map((item) => {
      const ownership = toNumber(item.ownershipPercentage, 0);
      const tokenCount = toNumber(item.tokenAmount, 0);
      const profitLoss = Number(clamp((ownership - 4.5) * 2.2, -18, 28).toFixed(1));

      return {
        name: item.shareName || "Unknown Asset",
        tokenCount,
        profitLoss,
      };
    })
    .sort((a, b) => b.profitLoss - a.profitLoss);

  const avgAbsMove = assets.length
    ? assets.reduce((sum, asset) => sum + Math.abs(asset.profitLoss), 0) / assets.length
    : 0;
  const riskScore = Number(clamp(72 - avgAbsMove * 2.4, 28, 88).toFixed(0));

  return {
    assets,
    riskScore,
    summary: buildSummary(assets, riskScore),
  };
}
