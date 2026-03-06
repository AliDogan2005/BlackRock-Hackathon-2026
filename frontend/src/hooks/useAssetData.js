import { useEffect, useState } from "react";

// Template hook for loading asset data from a local backend API.
export default function useAssetData(apiUrl, fallbackAssets = []) {
  const [assets, setAssets] = useState(fallbackAssets);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchAssets() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const normalized = Array.isArray(data) ? data : data.assets;

        if (!ignore) {
          setAssets(Array.isArray(normalized) ? normalized : fallbackAssets);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Unable to load assets");
          setAssets(fallbackAssets);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchAssets();

    return () => {
      ignore = true;
    };
  }, [apiUrl, fallbackAssets]);

  return { assets, loading, error };
}
