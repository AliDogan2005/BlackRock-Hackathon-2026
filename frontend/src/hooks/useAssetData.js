import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizePoint(rawPoint, index) {
  const dateValue = rawPoint?.date;
  const parsedDate = typeof dateValue === "string" && dateValue ? dateValue : `2026-01-${String(index + 1).padStart(2, "0")}`;
  const priceValue = toNumber(rawPoint?.price, 0);
  const riskValue = Math.max(0, Math.min(100, Math.round(toNumber(rawPoint?.riskScore, 50))));
  const hasNews = Boolean(rawPoint?.hasNews);
  const headlineValue = typeof rawPoint?.headline === "string" ? rawPoint.headline.trim() : "";

  return {
    date: parsedDate,
    price: Number(priceValue.toFixed(3)),
    riskScore: riskValue,
    hasNews,
    ...(headlineValue ? { headline: headlineValue } : {}),
  };
}

export default function useAssetData(regionId) {
  const [assetData, setAssetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const regionParam = useMemo(() => {
    if (regionId === null || regionId === undefined) {
      return "";
    }
    return String(regionId).trim();
  }, [regionId]);

  useEffect(() => {
    let cancelled = false;

    const fetchAssetData = async () => {
      if (!regionParam) {
        setAssetData([]);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const endpoint = `${API_BASE_URL}/api/shares/history?regionId=${encodeURIComponent(regionParam)}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`Asset history request failed (${response.status})`);
        }

        const payload = await response.json();
        const points = Array.isArray(payload) ? payload : [];
        const normalized = points.map((point, index) => normalizePoint(point, index));

        if (!cancelled) {
          setAssetData(normalized);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load region history");
          setAssetData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAssetData();

    return () => {
      cancelled = true;
    };
  }, [regionParam]);

  return { assetData, loading, error };
}
