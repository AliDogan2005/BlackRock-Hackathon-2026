const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function requestJson(path) {
  const response = await fetch(buildUrl(path));
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

function toRelativeTime(rawTimestamp) {
  if (!rawTimestamp) {
    return "just now";
  }

  const date = new Date(rawTimestamp);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) {
    return "just now";
  }

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day ago`;
}

function deriveSentimentScore(text) {
  const safe = String(text || "").toLowerCase();
  if (!safe) {
    return 0;
  }

  const positiveWords = [
    "growth",
    "surge",
    "increase",
    "improve",
    "bullish",
    "opportunity",
    "stable",
    "strong",
    "record",
    "demand",
  ];

  const negativeWords = [
    "risk",
    "decline",
    "drop",
    "down",
    "concern",
    "bearish",
    "slowdown",
    "volatility",
    "tighten",
    "repricing",
  ];

  const positiveHits = positiveWords.reduce((sum, word) => (safe.includes(word) ? sum + 1 : sum), 0);
  const negativeHits = negativeWords.reduce((sum, word) => (safe.includes(word) ? sum + 1 : sum), 0);

  return positiveHits - negativeHits;
}

function buildNewsTag(sentimentScore, sourceText) {
  const magnitude = clamp(Math.abs(sentimentScore) * 2 + (sourceText.length > 180 ? 2 : 1), 2, 12);
  const rounded = Math.round(magnitude);

  if (sentimentScore >= 0) {
    return {
      positive: true,
      tag: `Positive Impact: +${rounded}`,
    };
  }

  return {
    positive: false,
    tag: `Risk Increase: -${rounded}`,
  };
}

function normalizeNewsItems(rawNews, shares) {
  const regionNames = (shares || [])
    .map((share) => String(share?.name || "").trim())
    .filter(Boolean);

  const normalized = (rawNews || []).map((item, index) => {
    const headline = String(item?.title || item?.headline || item?.description || "").trim() || `Market update ${index + 1}`;
    const description = String(item?.description || "").trim();
    const analysis = String(item?.ai_comment || item?.aiComment || "").trim();
    const combined = `${headline} ${description} ${analysis}`.trim();
    const sentimentScore = deriveSentimentScore(combined);
    const tagInfo = buildNewsTag(sentimentScore, combined);

    const regionMatches = regionNames.reduce((sum, regionName) => {
      return combined.toLowerCase().includes(regionName.toLowerCase()) ? sum + 1 : sum;
    }, 0);

    const timestamp = item?.timestamp || item?.publishedAt || item?.date || null;
    const parsedTimestamp = timestamp ? new Date(timestamp).getTime() : 0;

    return {
      headline,
      time: toRelativeTime(timestamp),
      tag: tagInfo.tag,
      positive: tagInfo.positive,
      regionMatches,
      parsedTimestamp: Number.isFinite(parsedTimestamp) ? parsedTimestamp : 0,
    };
  });

  return normalized
    .sort((a, b) => {
      if (b.regionMatches !== a.regionMatches) {
        return b.regionMatches - a.regionMatches;
      }
      return b.parsedTimestamp - a.parsedTimestamp;
    })
    .map(({ regionMatches, parsedTimestamp, ...item }) => item);
}

function buildRegionMetrics(shares) {
  const safeShares = Array.isArray(shares) ? shares : [];
  if (!safeShares.length) {
    return {
      popular: [],
      demand: [],
    };
  }

  const prices = safeShares.map((share) => toNumber(share?.currentValue, 0));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = Math.max(0.0001, maxPrice - minPrice);

  const withMetrics = safeShares.map((share) => {
    const totalTokens = Math.max(1, toNumber(share?.totalTokens, 1));
    const availableTokens = clamp(toNumber(share?.availableTokens, totalTokens), 0, totalTokens);
    const utilization = clamp((totalTokens - availableTokens) / totalTokens, 0, 1);
    const demand = clamp(Math.round(utilization * 100), 0, 100);

    const price = toNumber(share?.currentValue, minPrice);
    const priceNormalized = clamp((price - minPrice) / priceRange, 0, 1);
    const nexusScore = clamp(Math.round(demand * 0.68 + (40 + priceNormalized * 60) * 0.32), 1, 99);

    return {
      region: String(share?.name || "Unknown Region"),
      demand,
      score: nexusScore,
      up: nexusScore >= 60 || demand >= 55,
      warning: availableTokens / totalTokens <= 0.32 ? "Low Inventory" : "High Purchase Requests",
    };
  });

  const popular = withMetrics
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ region, score, up }) => ({ region, score, up }));

  const demand = withMetrics
    .slice()
    .sort((a, b) => b.demand - a.demand)
    .slice(0, 12)
    .map(({ region, demand: buyDemand, warning }) => ({
      region,
      demand: buyDemand,
      warning,
    }));

  return { popular, demand };
}

function extractNewsItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
}

export async function fetchBulletinData() {
  const [newsResult, sharesResult] = await Promise.allSettled([
    requestJson("/api/news/all"),
    requestJson("/api/shares"),
  ]);

  const shares = sharesResult.status === "fulfilled" && Array.isArray(sharesResult.value)
    ? sharesResult.value
    : [];

  const rawNews = newsResult.status === "fulfilled"
    ? extractNewsItems(newsResult.value)
    : [];

  const news = normalizeNewsItems(rawNews, shares).slice(0, 12);
  const { popular, demand } = buildRegionMetrics(shares);

  if (!news.length && !popular.length && !demand.length) {
    throw new Error("No backend bulletin data available right now.");
  }

  return {
    news,
    popular,
    demand,
  };
}
