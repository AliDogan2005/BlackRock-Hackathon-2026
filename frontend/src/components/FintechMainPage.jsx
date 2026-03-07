import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  clearPersistedAuth,
  fetchUserProfile,
  getPersistedToken,
  getPersistedUser,
  updateUserDisplayName,
} from "../services/authService";
import { fetchAssetFocusedAnalysis, fetchPersonalizedAnalysisData } from "../services/analysisService";
import { fetchBulletinData } from "../services/bulletinService";
import {
  addShareToFavorites,
  fetchExplorerDashboardData,
  fetchUserFavoriteShares,
  mapShareToFavoriteAsset,
  removeShareFromFavorites,
} from "../services/dashboardService";
import { buyTokensForRegion, sellTokensForRegion } from "../services/tradingService";
import { depositToWallet, fetchWalletPortfolioData } from "../services/walletPortfolioService";
import useAssetData from "../hooks/useAssetData";
import {
  Area,
  AreaChart,
  Cell,
  CartesianGrid,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Home,
  LogOut,
  Newspaper,
  Search,
  Settings,
  Star,
  Wallet,
  ChevronDown,
} from "lucide-react";
import NexusFacetedMark from "./NexusFacetedMark";

const NAV_ITEMS = [
  { id: "explorer", label: "Home/Explorer", icon: Home },
  { id: "bulletin", label: "News & Trends", icon: Newspaper },
  { id: "analysis", label: "Asset Analysis", icon: Brain },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "settings", label: "Profile", icon: Settings },
];

const DEFAULT_DATA = {
  user: {
    name: "Analyst",
    address: "Kurfuerstendamm 110, Berlin",
  },
  marketPulse: {
    region: "Berlin Mitte",
    tokenPrice: 1.5,
    riskScore: 45,
    roiProjection: -2.3,
  },
  sentiment: {
    bullish: 68,
    bearish: 32,
  },
  ownership: {
    progress: 45,
    tokenName: "NXM-Mitte",
  },
};

const DEFAULT_FAVORITES = [
  {
    id: "fav-berlin-mitte",
    name: "Berlin Mitte",
    region: "Berlin Mitte",
    price: 1.5,
    change24h: 2.9,
    riskScore: 45,
    sparkline: [42, 46, 48, 50, 54, 58],
  },
  {
    id: "fav-miami-beach-front",
    name: "Miami Beach Front",
    region: "Miami Beach Front",
    price: 1.22,
    change24h: -1.4,
    riskScore: 63,
    sparkline: [64, 62, 60, 58, 56, 54],
  },
  {
    id: "fav-antalya-solar",
    name: "Antalya Solar District",
    region: "Antalya Solar District",
    price: 0.94,
    change24h: 3.3,
    riskScore: 39,
    sparkline: [28, 31, 30, 34, 36, 39],
  },
  {
    id: "fav-tokyo-bay",
    name: "Tokyo Bay",
    region: "Tokyo Bay",
    price: 1.71,
    change24h: 1.6,
    riskScore: 58,
    sparkline: [49, 51, 50, 53, 55, 57],
  },
  {
    id: "fav-dubai-marina",
    name: "Dubai Marina",
    region: "Dubai Marina",
    price: 1.36,
    change24h: -0.8,
    riskScore: 66,
    sparkline: [63, 61, 60, 59, 58, 57],
  },
  {
    id: "fav-lisbon-prime",
    name: "Lisbon Prime",
    region: "Lisbon Prime",
    price: 1.09,
    change24h: 2.1,
    riskScore: 47,
    sparkline: [40, 42, 43, 45, 46, 48],
  },
];

const MY_ASSETS = [
  { name: "Berlin Mitte", tokenCount: 1240, profitLoss: 6.2 },
  { name: "Antalya Solar District", tokenCount: 860, profitLoss: -1.8 },
  { name: "Tokyo Bay", tokenCount: 530, profitLoss: 4.9 },
  { name: "Dubai Marina", tokenCount: 415, profitLoss: 2.1 },
  { name: "Lisbon Prime", tokenCount: 390, profitLoss: -0.9 },
  { name: "Singapore Core", tokenCount: 310, profitLoss: 3.7 },
];

const ANALYSIS_RISK_SCORE = 67;

const WALLET_ALLOCATION = [
  { name: "Berlin", value: 40, color: "#1A120B" },
  { name: "Miami", value: 30, color: "#D4AF37" },
  { name: "Cash", value: 30, color: "#B8AA8A" },
];

const WALLET_TRANSACTIONS = [
  { type: "Deposit", asset: "Cash", amount: 12000, date: "2026-03-07" },
  { type: "Buy", asset: "Berlin Mitte", amount: 6400, date: "2026-03-06" },
  { type: "Sell", asset: "Miami Beach Front", amount: 2300, date: "2026-03-05" },
  { type: "Buy", asset: "Tokyo Bay", amount: 3150, date: "2026-03-04" },
  { type: "Deposit", asset: "Cash", amount: 8000, date: "2026-03-03" },
];

const PENDING_DEEP_DIVE_STORAGE_KEY = "nexus.pendingDeepDiveAsset";

function mergeData(incoming) {
  if (!incoming) {
    return DEFAULT_DATA;
  }

  return {
    ...DEFAULT_DATA,
    ...incoming,
    user: {
      ...DEFAULT_DATA.user,
      ...(incoming.user ?? {}),
    },
    marketPulse: {
      ...DEFAULT_DATA.marketPulse,
      ...(incoming.marketPulse ?? {}),
    },
    sentiment: {
      ...DEFAULT_DATA.sentiment,
      ...(incoming.sentiment ?? {}),
    },
    ownership: {
      ...DEFAULT_DATA.ownership,
      ...(incoming.ownership ?? {}),
    },
  };
}

function ShellCard({ title, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-[#1A120B]/10 bg-white p-5 shadow-[0_12px_30px_rgba(26,18,11,0.08)] ${className}`}>
      <h2 className="mb-4 font-serif text-base font-semibold tracking-wide text-[#1A120B]">{title}</h2>
      {children}
    </section>
  );
}

function OwnershipRing({ progress }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="grid place-items-center">
      <svg viewBox="0 0 160 160" className="h-44 w-44">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#EEE7D8" strokeWidth="12" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          transform="rotate(-90 80 80)"
        />
        <text x="80" y="86" textAnchor="middle" className="fill-[#1A120B] text-[28px] font-bold">
          {`${progress}%`}
        </text>
      </svg>
    </div>
  );
}

function toMonthLabel(dateValue, fallbackIndex) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return `M${fallbackIndex + 1}`;
  }

  return parsed.toLocaleDateString("en-US", { month: "short" });
}

function buildSyncedSeries(assetData) {
  return (assetData || []).map((point, index) => {
    const normalizedDate = typeof point?.date === "string" ? point.date : "";
    return {
      date: normalizedDate,
      month: toMonthLabel(normalizedDate, index),
      price: Number(point?.price ?? 0),
      riskScore: Number(point?.riskScore ?? 50),
      hasNews: Boolean(point?.hasNews),
      headline: point?.headline,
    };
  });
}

function NewsMarkerDot({ cx, cy, payload }) {
  if (!payload?.hasNews || typeof cx !== "number" || typeof cy !== "number") {
    return null;
  }

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle r="8" fill="#D4AF37" stroke="#1A120B" strokeWidth="1.5" />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="#1A120B"
        fontSize="9"
        fontWeight="700"
      >
        N
      </text>
    </g>
  );
}

function PriceNewsTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  return (
    <div className="max-w-[260px] rounded-xl border border-[#E3D5B8] bg-[#FFFDF8] px-3 py-2 text-xs text-[#1A120B] shadow-[0_10px_24px_rgba(26,18,11,0.12)]">
      <p className="font-semibold text-[#1A120B]">{point.date || point.month}</p>
      <p className="mt-0.5">Price: ${Number(point.price).toFixed(3)}</p>
      {point.headline ? <p className="mt-1 text-[#1A120B]/74">{point.headline}</p> : null}
    </div>
  );
}

function RiskTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#E3D5B8] bg-[#FFFDF8] px-3 py-2 text-xs text-[#1A120B] shadow-[0_10px_24px_rgba(26,18,11,0.12)]">
      <p className="font-semibold">{point.month}</p>
      <p className="mt-0.5">Risk Score: {Math.round(Number(point.riskScore))}</p>
    </div>
  );
}

function ExplorerPage({
  data,
  selectedAsset,
  regionId,
  walletData,
  isDepositing,
  onDepositRequest,
  onTradeComplete,
  isFavorite = false,
  canToggleFavorite = false,
  onToggleFavorite,
  isFavoriteSaving = false,
  favoriteStatusMessage = "",
}) {
  const [tradeTokenAmount, setTradeTokenAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [tradeActionLoading, setTradeActionLoading] = useState("");
  const [tradeStatusMessage, setTradeStatusMessage] = useState("");

  const pulse = selectedAsset
    ? {
        ...data.marketPulse,
        region: selectedAsset.region,
        tokenPrice: selectedAsset.price,
        riskScore: selectedAsset.riskScore,
        roiProjection: selectedAsset.change24h,
      }
    : data.marketPulse;
  const resolvedRegionId = regionId ?? selectedAsset?.regionId ?? selectedAsset?.region ?? data?.user?.address;
  const { assetData, loading: historyLoading, error: historyError } = useAssetData(resolvedRegionId);
  const syncedSeries = useMemo(() => buildSyncedSeries(assetData), [assetData]);
  const hasHistory = syncedSeries.length > 0;
  const isRegionNotFound = Boolean(regionId) && !selectedAsset;
  const latestPoint = hasHistory ? syncedSeries[syncedSeries.length - 1] : null;
  const firstPoint = hasHistory ? syncedSeries[0] : null;
  const focusedRegionLabel = String(
    selectedAsset?.name
      || (typeof resolvedRegionId === "string" ? resolvedRegionId : "")
      || pulse.region
      || data?.user?.address
      || "Unknown Region"
  ).trim();

  const derivedRoiProjection = useMemo(() => {
    if (!firstPoint || !latestPoint) {
      return Number(pulse.roiProjection ?? 0);
    }

    const startPrice = Number(firstPoint.price ?? 0);
    const endPrice = Number(latestPoint.price ?? 0);
    if (!Number.isFinite(startPrice) || !Number.isFinite(endPrice) || startPrice <= 0) {
      return Number(pulse.roiProjection ?? 0);
    }

    return Number((((endPrice - startPrice) / startPrice) * 100).toFixed(1));
  }, [firstPoint, latestPoint, pulse.roiProjection]);

  const resolvedPulse = {
    ...pulse,
    region: focusedRegionLabel,
    tokenPrice: latestPoint ? Number(latestPoint.price ?? pulse.tokenPrice) : pulse.tokenPrice,
    riskScore: latestPoint ? Math.round(Number(latestPoint.riskScore ?? pulse.riskScore)) : pulse.riskScore,
    roiProjection: derivedRoiProjection,
  };

  const hasResolvedDbRegion = !isRegionNotFound && (Boolean(selectedAsset) || hasHistory);
  const displayTokenPrice = hasResolvedDbRegion ? Number(resolvedPulse.tokenPrice) : null;
  const displayRiskScore = hasResolvedDbRegion ? Number(resolvedPulse.riskScore) : null;
  const displayRoiProjection = hasResolvedDbRegion ? Number(resolvedPulse.roiProjection) : null;

  const ownershipProgress = Math.max(0, Math.min(100, data.ownership.progress));
  const roiNegative = Number(displayRoiProjection ?? 0) < 0;
  const availableCash = Number(walletData?.availableCash ?? 0);
  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setTradeStatusMessage("Please enter a valid deposit amount greater than 0.");
      return;
    }

    if (!onDepositRequest) {
      setTradeStatusMessage("Deposit is unavailable right now.");
      return;
    }

    try {
      setTradeStatusMessage("");
      await onDepositRequest(amount);
      setDepositAmount("");
      setTradeStatusMessage(`Deposit successful: +$${amount.toFixed(2)}`);
    } catch (error) {
      setTradeStatusMessage(error instanceof Error ? error.message : "Deposit failed.");
    }
  };

  const handleTradeAction = async (action) => {
    const amount = Number(tradeTokenAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setTradeStatusMessage("Please enter a valid token amount greater than 0.");
      return;
    }

    const requestPayload = {
      regionId: selectedAsset?.regionId ?? regionId,
      regionName: focusedRegionLabel,
      tokenAmount: amount,
    };

    try {
      setTradeActionLoading(action);
      setTradeStatusMessage("");

      const result = action === "buy"
        ? await buyTokensForRegion(requestPayload)
        : await sellTokensForRegion(requestPayload);

      setTradeTokenAmount("");
      setTradeStatusMessage(result?.message || `${action.toUpperCase()} completed.`);

      if (onTradeComplete) {
        await onTradeComplete(result);
      }
    } catch (error) {
      setTradeStatusMessage(error instanceof Error ? error.message : `${action.toUpperCase()} failed.`);
    } finally {
      setTradeActionLoading("");
    }
  };

  return (
    <motion.div
      key="explorer"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <header className="rounded-2xl border border-[#1A120B]/10 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(26,18,11,0.08)]">
        <h1 className="font-serif text-2xl font-bold tracking-[0.01em] text-[#1A120B]">Market Explorer</h1>
        <p className="mt-1 text-sm text-[#1A120B]/72">
          Human + Machine intelligence across tokenized property markets. Focus region:{" "}
          <span className="inline-flex items-center gap-1.5 align-middle">
            <span className="font-semibold text-[#1A120B]">{focusedRegionLabel}</span>
            <motion.button
              type="button"
              onClick={onToggleFavorite}
              disabled={!canToggleFavorite || isFavoriteSaving}
              aria-label={isFavorite ? "Remove favorite asset" : "Mark as favorite asset"}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              whileTap={{ scale: 0.9 }}
              animate={{ scale: isFavorite ? 1.08 : 1 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Star
                className={`h-4.5 w-4.5 transition-colors ${isFavorite ? "text-[#D4AF37]" : "text-[#1A120B]/45"}`}
                fill={isFavorite ? "#D4AF37" : "none"}
                strokeWidth={isFavorite ? 2 : 2.1}
              />
            </motion.button>
          </span>
        </p>
        {isRegionNotFound ? (
          <p className="mt-2 inline-flex rounded-full border border-rose-300/60 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            Not found: this city is not available in the database.
          </p>
        ) : null}
        {selectedAsset ? (
          <p className="mt-2 inline-flex rounded-full bg-[#D4AF37]/18 px-3 py-1 text-xs font-semibold text-[#1A120B]">
            Focused Favorite: {selectedAsset.name}
          </p>
        ) : null}
        {favoriteStatusMessage ? (
          <p className="mt-2 text-xs font-semibold text-[#1A120B]/68">{favoriteStatusMessage}</p>
        ) : null}
      </header>

      <div className="grid gap-5 xl:grid-cols-12">
        <ShellCard title="Market Pulse" className="xl:col-span-3">
          <div className="space-y-3 text-sm text-[#1A120B]/88">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D4AF37]">Current Token Price</p>
              <p className="mt-1 text-xl font-bold text-[#1A120B]">
                {displayTokenPrice !== null ? `$${displayTokenPrice.toFixed(2)}` : "--"} <span className="text-sm font-medium text-[#1A120B]/65">({resolvedPulse.region})</span>
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#1A120B]/74">AI Risk Score</span>
              <strong className="text-lg text-[#1A120B]">{displayRiskScore !== null ? displayRiskScore : "--"}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#1A120B]/74">ROI Projection</span>
              {displayRoiProjection !== null ? (
                <strong className={roiNegative ? "text-rose-700" : "text-emerald-700"}>
                  {roiNegative ? "" : "+"}
                  {displayRoiProjection}%
                </strong>
              ) : (
                <strong className="text-[#1A120B]/55">--</strong>
              )}
            </div>
          </div>
        </ShellCard>

        <ShellCard title="Price & News Correlation" className="xl:col-span-6">
          {hasHistory && !isRegionNotFound ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={syncedSeries} syncId="explorer-history" margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceNewsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E8E0D2" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: "#614A2A", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: "#614A2A", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[(min) => Number((min - 0.02).toFixed(3)), (max) => Number((max + 0.02).toFixed(3))]}
                  />
                  <Tooltip content={<PriceNewsTooltip />} />
                  <Area type="monotone" dataKey="price" stroke="none" fill="url(#priceNewsFill)" fillOpacity={1} />
                  <Line type="monotone" dataKey="price" stroke="#1A120B" strokeWidth={3} dot={<NewsMarkerDot />} activeDot={{ r: 5, fill: "#1A120B" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid h-64 place-items-center rounded-xl border border-dashed border-[#1A120B]/16 bg-[#FAF8F2] px-4 text-center text-sm text-[#1A120B]/70">
              {isRegionNotFound
                ? `Not found: ${focusedRegionLabel} is not in the database.`
                : historyLoading
                ? "Loading backend history..."
                : historyError
                  ? `No backend history for ${focusedRegionLabel}.`
                  : `No backend history for ${focusedRegionLabel}.`}
            </div>
          )}
        </ShellCard>

        <ShellCard title="Trading Panel" className="xl:col-span-3">
          <div className="space-y-3">
            <div className="rounded-xl border border-[#1A120B]/12 bg-white/70 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#1A120B]/62">Wallet Cash</p>
              <p className="mt-1 text-sm font-bold text-[#1A120B]">${availableCash.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>

            <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-[#1A120B]/65">Deposit USD</label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                type="number"
                min="1"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                className="w-full rounded-xl border border-[#1A120B]/15 bg-[#FAF8F2] px-3 py-2.5 text-sm text-[#1A120B] outline-none focus:border-[#D4AF37]"
              />
              <button
                type="button"
                disabled={isDepositing || tradeActionLoading.length > 0}
                onClick={handleDeposit}
                className="rounded-xl border border-[#D4AF37] px-3 py-2 text-xs font-semibold text-[#1A120B] transition hover:bg-[#D4AF37]/14 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDepositing ? "ADDING..." : "DEPOSIT"}
              </button>
            </div>

            <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-[#1A120B]/65">Token</label>
            <input
              type="text"
              value={focusedRegionLabel || data.ownership.tokenName}
              readOnly
              className="w-full rounded-xl border border-[#1A120B]/15 bg-[#FAF8F2] px-3 py-2.5 text-sm text-[#1A120B] outline-none focus:border-[#D4AF37]"
            />
            <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-[#1A120B]/65">Amount</label>
            <input
              type="number"
              min="1"
              placeholder="Enter token amount"
              value={tradeTokenAmount}
              onChange={(event) => setTradeTokenAmount(event.target.value)}
              className="w-full rounded-xl border border-[#1A120B]/15 bg-[#FAF8F2] px-3 py-2.5 text-sm text-[#1A120B] outline-none focus:border-[#D4AF37]"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={tradeActionLoading.length > 0 || isRegionNotFound}
                onClick={() => handleTradeAction("buy")}
                className="rounded-xl bg-[#D4AF37] px-3 py-2 text-sm font-semibold text-[#1A120B] transition hover:bg-[#c39f2f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tradeActionLoading === "buy" ? "BUYING..." : "BUY"}
              </button>
              <button
                type="button"
                disabled={tradeActionLoading.length > 0 || isRegionNotFound}
                onClick={() => handleTradeAction("sell")}
                className="rounded-xl bg-[#D4AF37] px-3 py-2 text-sm font-semibold text-[#1A120B] transition hover:bg-[#c39f2f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tradeActionLoading === "sell" ? "SELLING..." : "SELL"}
              </button>
            </div>
            {isRegionNotFound ? (
              <p className="text-xs font-medium text-rose-700">Trading unavailable: city not found in database.</p>
            ) : null}
            {tradeStatusMessage ? (
              <p className="text-xs font-medium text-[#1A120B]/78">{tradeStatusMessage}</p>
            ) : null}
          </div>
        </ShellCard>

        <ShellCard title="Risk History Tracker" className="xl:col-span-9">
          {hasHistory && !isRegionNotFound ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={syncedSeries} syncId="explorer-history" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A8C69F" stopOpacity={0.86} />
                      <stop offset="100%" stopColor="#E29595" stopOpacity={0.86} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E8E0D2" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: "#614A2A", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#614A2A", fontSize: 12 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip content={<RiskTooltip />} />
                  {[35, 44, 53, 70].map((level) => (
                    <ReferenceLine key={`risk-threshold-${level}`} y={level} stroke="#C9BDA8" strokeDasharray="3 3" />
                  ))}
                  <Area type="monotone" dataKey="riskScore" stroke="#1A120B" strokeWidth={2.5} fill="url(#riskGradient)" fillOpacity={0.52} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid h-48 place-items-center rounded-xl border border-dashed border-[#1A120B]/16 bg-[#FAF8F2] px-4 text-center text-sm text-[#1A120B]/70">
              {isRegionNotFound
                ? `Not found: ${focusedRegionLabel} is not in the database.`
                : historyLoading
                ? "Loading backend risk history..."
                : historyError
                  ? `No backend risk history for ${focusedRegionLabel}.`
                  : `No backend risk history for ${focusedRegionLabel}.`}
            </div>
          )}
        </ShellCard>

        <ShellCard title="Homeownership Tracker" className="xl:col-span-3">
          {isRegionNotFound ? (
            <div className="grid h-[240px] place-items-center rounded-xl border border-dashed border-[#1A120B]/16 bg-[#FAF8F2] px-4 text-center text-sm text-[#1A120B]/70">
              Not found: no ownership path for this city in database.
            </div>
          ) : (
            <>
              <OwnershipRing progress={ownershipProgress} />
              <p className="mt-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
                Progress To Property Ownership
              </p>
              <p className="mt-2 text-center text-sm text-[#1A120B]/74">
                You own {ownershipProgress}% of the tokens required for this asset.
              </p>
            </>
          )}
        </ShellCard>

      </div>
    </motion.div>
  );
}

function BulletinColumn({ title, children, onMore }) {
  return (
    <section className="flex min-h-[520px] flex-col rounded-xl border border-[#1A120B]/10 bg-white/50 p-4 shadow-[0_10px_24px_rgba(26,18,11,0.08)] backdrop-blur-md">
      <h2 className="mb-4 font-serif text-lg font-bold tracking-wide text-[#1A120B]">{title}</h2>
      <div className="flex-1 space-y-3">{children}</div>
      <button
        type="button"
        onClick={onMore}
        className="mt-4 w-full rounded-xl border border-[#D4AF37] px-3 py-2 text-sm font-semibold text-[#1A120B] transition hover:bg-[#D4AF37]/14"
      >
        More
      </button>
    </section>
  );
}

function BulletinExpandedList({ title, items, onBack, renderItem, emptyMessage = "No backend data found." }) {
  return (
    <motion.section
      key={`expanded-${title}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-[#1A120B]/10 bg-white/50 p-4 shadow-[0_10px_24px_rgba(26,18,11,0.08)] backdrop-blur-md"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold tracking-wide text-[#1A120B]">{title} - Expanded View</h2>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-[#1A120B]/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#1A120B] transition hover:border-[#D4AF37]"
        >
          Back
        </button>
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <article key={`${title}-${index}`} className="rounded-xl border border-[#1A120B]/10 bg-white/70 p-3">
              {renderItem(item)}
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[#1A120B]/18 bg-white/45 px-4 py-5 text-sm text-[#1A120B]/65">
          {emptyMessage}
        </p>
      )}
    </motion.section>
  );
}

function BulletinPage() {
  const [expandedColumn, setExpandedColumn] = useState(null);
  const [bulletinData, setBulletinData] = useState({ news: [], popular: [], demand: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadBulletinData = async () => {
    try {
      setIsLoading(true);
      setLoadError("");
      const payload = await fetchBulletinData();
      setBulletinData({
        news: Array.isArray(payload?.news) ? payload.news : [],
        popular: Array.isArray(payload?.popular) ? payload.popular : [],
        demand: Array.isArray(payload?.demand) ? payload.demand : [],
      });
    } catch (error) {
      setBulletinData({ news: [], popular: [], demand: [] });
      setLoadError(error instanceof Error ? error.message : "Unable to load bulletin data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    const guardedLoad = async () => {
      if (!alive) {
        return;
      }
      await loadBulletinData();
    };

    guardedLoad();
    const timerId = window.setInterval(guardedLoad, 30000);

    return () => {
      alive = false;
      window.clearInterval(timerId);
    };
  }, []);

  const newsItems = bulletinData.news;
  const popularRegions = bulletinData.popular;
  const demandRegions = bulletinData.demand;

  const columnMotion = {
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  };

  if (expandedColumn === "news") {
    return (
      <BulletinExpandedList
        title="NEWS"
        items={newsItems}
        onBack={() => setExpandedColumn(null)}
        emptyMessage={loadError || "No news from backend yet."}
        renderItem={(item) => (
          <>
            <h3 className="text-sm font-semibold text-[#1A120B]">{item.headline}</h3>
            <p className="mt-1 text-xs text-[#1A120B]/62">{item.time}</p>
            <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${item.positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
              {item.tag}
            </span>
          </>
        )}
      />
    );
  }

  if (expandedColumn === "popular") {
    return (
      <BulletinExpandedList
        title="POPULAR REGIONS"
        items={popularRegions}
        onBack={() => setExpandedColumn(null)}
        emptyMessage={loadError || "No region popularity data from backend yet."}
        renderItem={(item) => (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {item.up ? <ArrowUpRight className="h-4 w-4 text-emerald-700" /> : <ArrowDownRight className="h-4 w-4 text-rose-700" />}
              <span className="text-sm font-semibold text-[#1A120B]">{item.region}</span>
            </div>
            <span className="rounded-full bg-[#F5F2EA] px-2 py-1 text-xs font-semibold text-[#1A120B]">Nexus Score {item.score}</span>
          </div>
        )}
      />
    );
  }

  if (expandedColumn === "demand") {
    return (
      <BulletinExpandedList
        title="MOST DEMAND REGIONS"
        items={demandRegions}
        onBack={() => setExpandedColumn(null)}
        emptyMessage={loadError || "No region demand data from backend yet."}
        renderItem={(item) => (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1A120B]">{item.region}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                <AlertTriangle className="h-3.5 w-3.5" />
                {item.warning}
              </span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-[#EAE4D8]">
              <div className="h-2.5 rounded-full bg-[#D4AF37]" style={{ width: `${item.demand}%` }} />
            </div>
            <p className="mt-1 text-right text-xs font-semibold text-[#1A120B]/68">Buy Demand {item.demand}%</p>
          </>
        )}
      />
    );
  }

  return (
    <motion.div
      key="bulletin"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <header className="rounded-2xl border border-[#1A120B]/10 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(26,18,11,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-2xl font-bold tracking-[0.01em] text-[#1A120B]">News & Trends</h1>
          <button
            type="button"
            onClick={loadBulletinData}
            className="rounded-xl border border-[#1A120B]/14 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#1A120B] transition hover:border-[#D4AF37]"
          >
            Refresh
          </button>
        </div>
        <p className="mt-1 text-sm text-[#1A120B]/72">
          {isLoading
            ? "Loading live regional intelligence from backend..."
            : loadError
              ? `Backend feed status: ${loadError}`
              : "Live regional intelligence feed with sentiment, score momentum, and demand pressure."}
        </p>
      </header>

      <motion.div
        initial="initial"
        animate="animate"
        className="grid gap-4 lg:grid-cols-3"
      >
        <motion.div {...columnMotion} transition={{ ...columnMotion.transition, delay: 0.04 }}>
          <BulletinColumn title="NEWS" onMore={() => setExpandedColumn("news")}>
            {newsItems.length ? (
              newsItems.slice(0, 4).map((item, index) => (
                <article key={`news-${index}`} className="rounded-xl border border-[#1A120B]/10 bg-white/70 p-3">
                  <h3 className="text-sm font-semibold text-[#1A120B]">{item.headline}</h3>
                  <p className="mt-1 text-xs text-[#1A120B]/62">{item.time}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${item.positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {item.tag}
                  </span>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[#1A120B]/18 bg-white/45 px-4 py-5 text-sm text-[#1A120B]/65">
                {isLoading ? "Loading backend news..." : "No news data from backend."}
              </p>
            )}
          </BulletinColumn>
        </motion.div>

        <motion.div {...columnMotion} transition={{ ...columnMotion.transition, delay: 0.1 }}>
          <BulletinColumn title="POPULAR REGIONS" onMore={() => setExpandedColumn("popular")}>
            {popularRegions.length ? (
              popularRegions.slice(0, 4).map((item, index) => (
                <article key={`popular-${index}`} className="rounded-xl border border-[#1A120B]/10 bg-white/70 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.up ? <ArrowUpRight className="h-4 w-4 text-emerald-700" /> : <ArrowDownRight className="h-4 w-4 text-rose-700" />}
                      <span className="text-sm font-semibold text-[#1A120B]">{item.region}</span>
                    </div>
                    <span className="rounded-full bg-[#F5F2EA] px-2 py-1 text-xs font-semibold text-[#1A120B]">{item.score}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#1A120B]/62">Nexus Score</p>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[#1A120B]/18 bg-white/45 px-4 py-5 text-sm text-[#1A120B]/65">
                {isLoading ? "Loading backend regions..." : "No popular regions from backend."}
              </p>
            )}
          </BulletinColumn>
        </motion.div>

        <motion.div {...columnMotion} transition={{ ...columnMotion.transition, delay: 0.16 }}>
          <BulletinColumn title="MOST DEMAND REGIONS" onMore={() => setExpandedColumn("demand")}>
            {demandRegions.length ? (
              demandRegions.slice(0, 4).map((item, index) => (
                <article key={`demand-${index}`} className="rounded-xl border border-[#1A120B]/10 bg-white/70 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1A120B]">{item.region}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {item.warning}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-[#EAE4D8]">
                    <div className="h-2.5 rounded-full bg-[#D4AF37]" style={{ width: `${item.demand}%` }} />
                  </div>
                  <p className="mt-1 text-right text-xs font-semibold text-[#1A120B]/68">Buy Demand {item.demand}%</p>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[#1A120B]/18 bg-white/45 px-4 py-5 text-sm text-[#1A120B]/65">
                {isLoading ? "Loading backend demand data..." : "No demand regions from backend."}
              </p>
            )}
          </BulletinColumn>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function getRiskScoreStyles(score) {
  if (!Number.isFinite(score)) {
    return {
      text: "text-[#1A120B]/65",
      ring: "border-[#1A120B]/20",
      label: "No Data",
    };
  }

  if (score <= 40) {
    return {
      text: "text-emerald-700",
      ring: "border-emerald-500/40",
      label: "Low Risk",
    };
  }

  if (score <= 70) {
    return {
      text: "text-amber-700",
      ring: "border-amber-500/40",
      label: "Moderate Risk",
    };
  }

  return {
    text: "text-rose-700",
    ring: "border-rose-500/40",
    label: "High Risk",
  };
}

function parseRiskScoreFromAnalysis(text) {
  const source = String(text || "");
  if (!source) {
    return null;
  }

  const direct = source.match(/risk\s*score\s*[:=-]?\s*(\d{1,3})/i);
  if (direct) {
    const score = Number(direct[1]);
    if (Number.isFinite(score)) {
      return Math.max(0, Math.min(100, Math.round(score)));
    }
  }

  const percent = source.match(/(\d{1,3})\s*%/);
  if (percent) {
    const score = Number(percent[1]);
    if (Number.isFinite(score) && score >= 0 && score <= 100) {
      return Math.round(score);
    }
  }

  return null;
}

function buildHistoryBackedAnalysis(asset, historyPoints, riskScore) {
  const assetName = String(asset?.name || "Selected asset");
  const points = Array.isArray(historyPoints) ? historyPoints : [];

  if (!points.length) {
    return `AI Analysis: ${assetName} has no recent backend history points yet. Add more market activity data to generate a stronger confidence profile.`;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const startPrice = Number(first?.price ?? 0);
  const endPrice = Number(last?.price ?? 0);
  const trendPct = startPrice > 0 ? (((endPrice - startPrice) / startPrice) * 100) : 0;
  const trendLabel = trendPct >= 0 ? "uptrend" : "downtrend";
  const momentumLabel = trendPct >= 1.2 ? "strong" : trendPct <= -1.2 ? "weak" : "neutral";
  const stance = Number(riskScore) <= 40
    ? "controlled risk posture"
    : Number(riskScore) <= 70
      ? "balanced risk posture"
      : "elevated risk posture";

  return `AI Analysis: ${assetName} is currently in a ${trendLabel} (${trendPct >= 0 ? "+" : ""}${trendPct.toFixed(1)}%) with ${momentumLabel} momentum based on backend share history. Current model indicates ${stance} (Risk Score: ${Math.round(Number(riskScore))}). Suggested action: ${Number(riskScore) > 70 ? "reduce position size or wait for confirmation" : "continue with measured exposure and monitor next updates"}.`;
}

function AnalysisPage({ data, analysisData }) {
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [selectedAssetName, setSelectedAssetName] = useState("");
  const [assetAnalysisByName, setAssetAnalysisByName] = useState({});
  const [assetAnalysisLoading, setAssetAnalysisLoading] = useState(false);
  const [assetAnalysisError, setAssetAnalysisError] = useState("");
  const assets = Array.isArray(analysisData?.assets) ? analysisData.assets : [];
  const hasAssets = assets.length > 0;
  const visibleAssets = showAllAssets ? assets : assets.slice(0, 4);
  const portfolioRiskScore = Number.isFinite(Number(analysisData?.riskScore))
    ? Number(analysisData.riskScore)
    : null;
  const defaultSummary = analysisData?.summary
    || "AI Analysis is ready. Select an asset from My Assets to get focused intelligence for that specific position.";
  const selectedAsset = assets.find((asset) => asset.name === selectedAssetName) || assets[0] || null;
  const selectedAssetKey = selectedAsset?.name || "";
  const { assetData: selectedAssetHistory } = useAssetData(selectedAssetKey);

  useEffect(() => {
    if (!assets.length) {
      setSelectedAssetName("");
      return;
    }

    if (!selectedAssetName || !assets.some((asset) => asset.name === selectedAssetName)) {
      setSelectedAssetName(assets[0].name);
    }
  }, [assets, selectedAssetName]);

  useEffect(() => {
    let active = true;

    const loadFocusedAssetAnalysis = async () => {
      if (!selectedAsset || !selectedAssetKey) {
        return;
      }

      if (assetAnalysisByName[selectedAssetKey]) {
        setAssetAnalysisError("");
        return;
      }

      try {
        setAssetAnalysisLoading(true);
        setAssetAnalysisError("");
        const result = await fetchAssetFocusedAnalysis(selectedAsset);
        if (active) {
          setAssetAnalysisByName((previous) => ({
            ...previous,
            [selectedAssetKey]: result,
          }));
        }
      } catch (error) {
        if (active) {
          setAssetAnalysisError(error instanceof Error ? error.message : "Asset analysis request failed.");
        }
      } finally {
        if (active) {
          setAssetAnalysisLoading(false);
        }
      }
    };

    loadFocusedAssetAnalysis();

    return () => {
      active = false;
    };
  }, [selectedAsset, selectedAssetKey, assetAnalysisByName]);

  const selectedAssetAnalysis = selectedAssetKey ? assetAnalysisByName[selectedAssetKey] : "";
  const skippedDueToMissingKey = /analysis\s*skipped\s*:\s*no\s*api\s*key/i.test(selectedAssetAnalysis);
  const historyRiskScore = selectedAssetHistory.length
    ? Number(selectedAssetHistory[selectedAssetHistory.length - 1]?.riskScore)
    : null;
  const aiRiskScore = parseRiskScoreFromAnalysis(selectedAssetAnalysis);
  const fallbackAssetRisk = selectedAsset
    ? Math.max(10, Math.min(95, Math.round(56 - Number(selectedAsset?.profitLoss || 0) * 2.6)))
    : null;
  const riskScore = hasAssets
    ? (aiRiskScore ?? historyRiskScore ?? fallbackAssetRisk ?? portfolioRiskScore ?? ANALYSIS_RISK_SCORE)
    : null;
  const riskStyle = getRiskScoreStyles(riskScore);
  const generatedAnalysis = hasAssets && selectedAsset
    ? buildHistoryBackedAnalysis(selectedAsset, selectedAssetHistory, riskScore ?? ANALYSIS_RISK_SCORE)
    : "";
  const analysisSummary = selectedAssetAnalysis && !skippedDueToMissingKey
    ? selectedAssetAnalysis
    : (assetAnalysisLoading
      ? "Generating AI analysis for selected asset..."
      : assetAnalysisError
        ? `AI analysis unavailable for ${selectedAssetKey || "selected asset"}. ${assetAnalysisError}`
        : hasAssets
          ? generatedAnalysis || defaultSummary
          : "You do not own any assets yet. Once you buy a tokenized asset, it will appear here with AI analysis and an updated risk score.");

  return (
    <motion.div
      key="analysis"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <header className="rounded-2xl border border-[#1A120B]/10 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(26,18,11,0.08)]">
        <h1 className="font-serif text-2xl font-bold tracking-[0.01em] text-[#1A120B]">Personalized Analysis</h1>
        <p className="mt-1 text-sm text-[#1A120B]/72">
          Portfolio intelligence tailored for {data.user.name}. Human-led conviction supported by machine-led forecasting.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.section
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-[#1A120B]/10 bg-white/50 p-4 shadow-[0_12px_30px_rgba(26,18,11,0.08)] backdrop-blur-md"
        >
          <h2 className="mb-4 font-serif text-xl font-bold text-[#1A120B]">My Assets</h2>

          {hasAssets ? (
            <>
              <div className="space-y-3">
                {visibleAssets.map((asset) => {
                  const positive = asset.profitLoss >= 0;
                  const isSelected = asset.name === selectedAssetKey;
                  return (
                    <button
                      key={asset.name}
                      type="button"
                      onClick={() => setSelectedAssetName(asset.name)}
                      className={`w-full rounded-xl border bg-white/60 p-3 text-left transition ${
                        isSelected
                          ? "border-[#D4AF37] shadow-[0_0_0_1px_rgba(212,175,55,0.25)]"
                          : "border-[#1A120B]/10 hover:border-[#D4AF37]/45"
                      }`}
                    >
                      <h3 className="text-sm font-semibold text-[#1A120B]">{asset.name}</h3>
                      <div className="mt-2 flex items-center justify-between text-xs text-[#1A120B]/74">
                        <span>My Token Count</span>
                        <span className="font-semibold text-[#1A120B]">{Number(asset.tokenCount || 0).toLocaleString()}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-xs text-[#1A120B]/74">
                        <span>Profit/Loss</span>
                        <span className={`inline-flex items-center gap-1 font-semibold ${positive ? "text-emerald-700" : "text-rose-700"}`}>
                          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          {positive ? "+" : ""}
                          {asset.profitLoss}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {assets.length > 4 ? (
                <button
                  type="button"
                  onClick={() => setShowAllAssets((current) => !current)}
                  className="mt-4 w-full rounded-xl border border-[#D4AF37] px-3 py-2 text-sm font-semibold text-[#1A120B] transition hover:bg-[#D4AF37]/14"
                >
                  {showAllAssets ? "Collapse" : "More"}
                </button>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-[#1A120B]/18 bg-white/60 p-4 text-sm text-[#1A120B]/72">
              You do not own any assets yet.
            </div>
          )}
        </motion.section>

        <div className="space-y-5">
          <motion.section
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.38, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-[#1A120B]/10 bg-white/50 p-4 shadow-[0_12px_30px_rgba(26,18,11,0.08)] backdrop-blur-md"
          >
            <h2 className="mb-3 font-serif text-xl font-bold text-[#1A120B]">Analyze</h2>
            <article className="rounded-xl border border-[#1A120B]/10 bg-white/70 p-4">
              {hasAssets && selectedAssetKey ? (
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.11em] text-[#D4AF37]">
                  Focused Asset: {selectedAssetKey}
                </p>
              ) : null}
              <p className="text-sm leading-relaxed text-[#1A120B]/80">
                {analysisSummary}
              </p>
            </article>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.38, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-[#1A120B]/10 bg-white/50 p-4 shadow-[0_12px_30px_rgba(26,18,11,0.08)] backdrop-blur-md"
          >
            <h2 className="mb-3 font-serif text-xl font-bold text-[#1A120B]">Risk Score</h2>
            <div className={`mx-auto grid aspect-square w-full max-w-[260px] place-items-center rounded-2xl border-2 bg-white/70 ${riskStyle.ring}`}>
              <div className="text-center">
                <p className={`text-5xl font-black ${riskStyle.text}`}>
                  {Number.isFinite(riskScore) ? `${riskScore}%` : "--"}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1A120B]/70">{riskStyle.label}</p>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}

function FavoritesPage({ favorites, onExploreAssets, onOpenFavorite }) {
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const visibleFavorites = showAllFavorites ? favorites : favorites.slice(0, 6);

  if (favorites.length === 0) {
    return (
      <motion.section
        key="favorites-empty"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="grid min-h-[460px] place-items-center rounded-2xl border border-[#1A120B]/10 bg-white/50 p-8 text-center shadow-[0_10px_24px_rgba(26,18,11,0.08)] backdrop-blur-md"
      >
        <div>
          <p className="text-xl font-semibold text-[#1A120B]">You are not currently following any region.</p>
          <button
            type="button"
            onClick={onExploreAssets}
            className="mt-4 rounded-xl border border-[#D4AF37]/75 px-4 py-2 text-sm font-semibold text-[#1A120B] transition hover:bg-[#D4AF37]/16"
          >
            Explore Assets
          </button>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.div
      key="favorites-filled"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <header className="rounded-2xl border border-[#1A120B]/10 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(26,18,11,0.08)]">
        <h1 className="font-serif text-2xl font-bold tracking-[0.01em] text-[#1A120B]">Favorites</h1>
        <p className="mt-1 text-sm text-[#1A120B]/72">Tracked assets with quick risk and momentum signals.</p>
      </header>

      <motion.section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08,
              delayChildren: 0.04,
            },
          },
        }}
      >
        {visibleFavorites.map((asset) => {
          const positive = asset.change24h >= 0;
          return (
            <motion.article
              key={asset.id}
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="cursor-pointer rounded-2xl border border-[#1A120B]/10 bg-white/60 p-4 shadow-[0_10px_24px_rgba(26,18,11,0.08)] backdrop-blur-md transition hover:-translate-y-1 hover:border-[#D4AF37]/45"
              onClick={() => onOpenFavorite(asset)}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-serif text-lg font-semibold text-[#1A120B]">{asset.name}</h2>
                <span className="rounded-full bg-[#F5F2EA] px-2.5 py-1 text-xs font-semibold text-[#1A120B]">Risk {asset.riskScore}</span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-base font-bold text-[#1A120B]">${asset.price.toFixed(2)}</p>
                <p className={`text-sm font-semibold ${positive ? "text-emerald-700" : "text-rose-700"}`}>
                  {positive ? "+" : ""}
                  {asset.change24h}% (24h)
                </p>
              </div>

              <div className="mt-3 flex items-end gap-1.5">
                {asset.sparkline.map((point, index) => (
                  <span
                    key={`${asset.id}-spark-${index}`}
                    className={`w-2 rounded-sm ${positive ? "bg-emerald-500/75" : "bg-rose-500/75"}`}
                    style={{ height: `${Math.max(10, point)}px` }}
                  />
                ))}
              </div>
            </motion.article>
          );
        })}
      </motion.section>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowAllFavorites((current) => !current)}
          className="rounded-xl border border-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#1A120B] transition hover:bg-[#D4AF37]/14"
        >
          {showAllFavorites ? "Collapse" : "More"}
        </button>
      </div>
    </motion.div>
  );
}

function CountUpValue({ value, decimals = 0, prefix = "", className = "" }) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(
    Number(0).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.15,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setDisplay(
          Number(latest).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        );
      },
    });

    return () => controls.stop();
  }, [decimals, motionValue, value]);

  return <motion.span className={className}>{prefix}{display}</motion.span>;
}

function WalletPage({ walletData, onDeposit, isDepositing, liveTransactions = [] }) {
  const [transactionFilter, setTransactionFilter] = useState("ALL");
  const availableCash = walletData?.availableCash ?? 185240;
  const tokenValue = walletData?.tokenValue ?? 412860;
  const totalAssetValue = walletData?.totalAssetValue ?? availableCash + tokenValue;
  const profitLossPct = walletData?.profitLossPct ?? 12.5;
  const valueChange = walletData?.valueChange ?? 66980;
  const allocation = walletData?.allocation?.length ? walletData.allocation : WALLET_ALLOCATION;
  const hasBackendHistory = walletData?.transactionsSource === "backend-history";
  const baseTransactions = walletData?.transactions?.length
    ? walletData.transactions
    : WALLET_TRANSACTIONS;
  const transactions = hasBackendHistory
    ? baseTransactions.slice(0, 12)
    : [...liveTransactions, ...baseTransactions].slice(0, 12);
  const dedupedTransactions = useMemo(() => {
    const seen = new Set();
    return transactions.filter((row) => {
      const key = `${String(row?.type || "").toUpperCase()}|${String(row?.asset || "").toUpperCase()}|${Number(row?.amount || 0).toFixed(2)}|${String(row?.date || "")}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [transactions]);
  const filteredTransactions = useMemo(() => {
    if (transactionFilter === "ALL") {
      return dedupedTransactions;
    }

    return dedupedTransactions.filter((row) => String(row?.type || "").toUpperCase() === transactionFilter);
  }, [dedupedTransactions, transactionFilter]);
  const profit = profitLossPct >= 0;

  return (
    <motion.div
      key="wallet"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <header className="rounded-2xl border border-[#1A120B]/10 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(26,18,11,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-[0.01em] text-[#1A120B]">Wallet & Portfolio</h1>
            <p className="mt-1 text-sm text-[#1A120B]/72">Capital visibility, allocation posture, and recent activity in one institutional view.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDeposit}
              disabled={isDepositing}
              className="rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
            >
              {isDepositing ? "Processing..." : "Deposit"}
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-12">
        <section className="xl:col-span-8 rounded-2xl border border-[#1A120B]/10 bg-white/60 p-5 shadow-[0_12px_30px_rgba(26,18,11,0.08)] backdrop-blur-md">
          <h2 className="mb-4 font-serif text-lg font-bold text-[#1A120B]">Main Balance</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-[#1A120B]/10 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#1A120B]/64">Available Cash</p>
              <p className="mt-2 text-3xl font-black text-[#1A120B]">
                <CountUpValue value={availableCash} decimals={2} prefix="$" />
              </p>
            </article>
            <article className="rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#1A120B]/64">Total Asset Value (TAV)</p>
              <p className="mt-2 text-3xl font-black text-[#D4AF37]">
                <CountUpValue value={totalAssetValue} decimals={2} prefix="$" />
              </p>
            </article>
          </div>
        </section>

        <section className="xl:col-span-4 rounded-2xl border border-[#1A120B]/10 bg-white/60 p-5 shadow-[0_12px_30px_rgba(26,18,11,0.08)] backdrop-blur-md">
          <h2 className="mb-4 font-serif text-lg font-bold text-[#1A120B]">Portfolio Performance</h2>
          <div className="rounded-2xl border border-[#1A120B]/10 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#1A120B]/64">Total Profit/Loss</p>
            <p className={`mt-2 text-3xl font-black ${profit ? "text-emerald-700" : "text-rose-700"}`}>
              <CountUpValue value={profitLossPct} decimals={1} prefix={profit ? "+" : ""} />%
            </p>
            <p className={`mt-2 text-sm font-semibold ${profit ? "text-emerald-700" : "text-rose-700"}`}>
              {profit ? "+" : ""}$
              <CountUpValue value={valueChange} />
            </p>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="xl:col-span-4 rounded-2xl border border-[#1A120B]/10 bg-white/60 p-5 shadow-[0_12px_30px_rgba(26,18,11,0.08)] backdrop-blur-md"
        >
          <h2 className="mb-4 font-serif text-lg font-bold text-[#1A120B]">Asset Allocation</h2>
          <div className="h-72 w-full rounded-2xl border border-[#1A120B]/10 bg-white/70 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={2}>
                  {allocation.map((entry) => (
                    <Cell key={`alloc-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {allocation.map((entry) => (
              <div key={`legend-${entry.name}`} className="flex items-center gap-1.5 text-xs text-[#1A120B]/78">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <section className="xl:col-span-8 rounded-2xl border border-[#1A120B]/10 bg-white/60 p-5 shadow-[0_12px_30px_rgba(26,18,11,0.08)] backdrop-blur-md">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-lg font-bold text-[#1A120B]">Transaction History</h2>
            <div className="inline-flex rounded-xl border border-[#1A120B]/12 bg-white/70 p-1">
              {[
                { id: "ALL", label: "All" },
                { id: "BUY", label: "Buy" },
                { id: "SELL", label: "Sell" },
                { id: "DEPOSIT", label: "Deposit" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTransactionFilter(option.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                    transactionFilter === option.id
                      ? "bg-[#D4AF37] text-[#1A120B]"
                      : "text-[#1A120B]/70 hover:text-[#1A120B]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#1A120B]/10 bg-white/70">
            <table className="w-full text-left text-sm text-[#1A120B]">
              <thead className="bg-[#F5F2EA] text-xs uppercase tracking-[0.09em] text-[#1A120B]/64">
                <tr>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Asset</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length ? (
                  filteredTransactions.map((row) => (
                    <tr key={`${row.type}-${row.asset}-${row.date}-${row.amount}`} className="border-t border-[#1A120B]/8">
                      <td className="px-4 py-3 font-medium">{row.type}</td>
                      <td className="px-4 py-3">{row.asset}</td>
                      <td className="px-4 py-3 font-semibold">${row.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[#1A120B]/70">{row.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[#1A120B]/8">
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-[#1A120B]/60">
                      No transactions for selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function DepositFundsModal({ isOpen, amount, onAmountChange, onClose, onSubmit, isSubmitting, errorMessage }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#1A120B]/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/35 bg-white p-5 shadow-[0_24px_50px_rgba(26,18,11,0.28)]">
        <h2 className="font-serif text-xl font-bold text-[#1A120B]">Deposit Funds</h2>
        <p className="mt-1 text-sm text-[#1A120B]/72">Add cash to your wallet to start testing buy/sell actions.</p>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.1em] text-[#1A120B]/65">
          Amount (USD)
        </label>
        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[#1A120B]/14 bg-[#FAF8F2] px-3 py-2.5 text-sm text-[#1A120B] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/28"
          placeholder="100"
        />

        {errorMessage ? (
          <p className="mt-3 rounded-lg border border-rose-300/60 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-[#1A120B]/18 px-4 py-2 text-sm font-semibold text-[#1A120B] transition hover:border-[#D4AF37]/45 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Depositing..." : "Confirm Deposit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ userName = "Analyst", onSaveDisplayName, isSavingDisplayName = false, saveStatus = { type: "idle", message: "" } }) {
  const [displayName, setDisplayName] = useState(userName);

  useEffect(() => {
    setDisplayName(userName || "Analyst");
  }, [userName]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSaveDisplayName) {
      onSaveDisplayName(displayName);
    }
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <header className="rounded-2xl border border-[#1A120B]/10 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(26,18,11,0.08)]">
        <h1 className="font-serif text-2xl font-bold tracking-[0.01em] text-[#1A120B]">Profile</h1>
        <p className="mt-1 text-sm text-[#1A120B]/72">Manage profile identity, payment method, and account security settings.</p>
      </header>

      <div className="grid gap-4">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-[#1A120B]/10 bg-white/60 p-5 shadow-[0_12px_30px_rgba(26,18,11,0.08)] backdrop-blur-md"
        >
          <h2 className="font-serif text-lg font-bold text-[#1A120B]">Profile Management</h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-[240px_1fr]">
            <div className="flex flex-col items-center rounded-2xl border border-[#1A120B]/10 bg-white/70 p-4">
              <div className="grid h-24 w-24 place-items-center rounded-full border-2 border-[#D4AF37]/35 bg-[#F5F2EA] text-sm font-semibold uppercase tracking-[0.12em] text-[#1A120B]/52">
                Avatar
              </div>
              <button
                type="button"
                disabled
                className="mt-3 rounded-xl border border-[#1A120B]/12 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A120B]/45"
              >
                Photo Upload (Soon)
              </button>
            </div>

            <form className="rounded-2xl border border-[#1A120B]/10 bg-white/70 p-4" onSubmit={handleSubmit}>
              <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-[#1A120B]/64">Display Name</label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                type="text"
                placeholder="Display Name"
                className="mt-2 w-full rounded-xl border border-[#1A120B]/14 bg-white px-3 py-2.5 text-sm text-[#1A120B] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30"
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingDisplayName}
                  className="rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  {isSavingDisplayName ? "Saving..." : "Save Changes"}
                </button>
              </div>

              {saveStatus.type !== "idle" ? (
                <p
                  className={`mt-3 rounded-lg border px-3 py-2 text-xs font-medium ${
                    saveStatus.type === "success"
                      ? "border-emerald-500/60 bg-emerald-50 text-emerald-700"
                      : "border-rose-500/60 bg-rose-50 text-rose-700"
                  }`}
                  role="status"
                >
                  {saveStatus.message}
                </p>
              ) : null}
            </form>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-[#1A120B]/10 bg-white/60 p-5 shadow-[0_12px_30px_rgba(26,18,11,0.08)] backdrop-blur-md"
        >
          <h2 className="font-serif text-lg font-bold text-[#1A120B]">Payment Methods</h2>
          <div className="mt-4 rounded-2xl border border-[#1A120B]/12 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#1A120B]/64">Primary Card</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg font-semibold tracking-[0.08em] text-[#1A120B]">**** **** **** 1234</p>
              <button
                type="button"
                className="rounded-xl border border-[#1A120B]/18 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A120B] transition hover:border-[#D4AF37]/45"
              >
                Edit Card
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-rose-300/55 bg-white/60 p-5 shadow-[0_12px_30px_rgba(26,18,11,0.08)] backdrop-blur-md"
        >
          <h2 className="font-serif text-lg font-bold text-[#1A120B]">Account Security</h2>
          <p className="mt-1 text-sm text-[#1A120B]/72">Danger Zone: deleting your account permanently removes wallet and profile data.</p>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="rounded-xl border border-rose-400/70 bg-transparent px-4 py-2 text-sm font-semibold text-[#1A120B] transition hover:bg-rose-50"
            >
              Delete Account
            </button>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}

function PlaceholderPage({ section }) {
  const selected = NAV_ITEMS.find((item) => item.id === section);
  return (
    <motion.div
      key={section}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="grid min-h-[320px] place-items-center rounded-2xl border border-[#1A120B]/12 bg-white/72 p-6 text-center shadow-[0_10px_24px_rgba(26,18,11,0.1)] backdrop-blur-sm"
    >
      <div>
        <p className="text-lg font-semibold text-[#1A120B]">{selected?.label}</p>
        <p className="mt-2 text-sm text-[#1A120B]/72">Section shell is ready with Framer Motion transitions.</p>
      </div>
    </motion.div>
  );
}

export default function FintechMainPage({ explorerData, onSignOut }) {
  const [activeSection, setActiveSection] = useState("explorer");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedExplorerAsset, setSelectedExplorerAsset] = useState(null);
  const [explorerRegionId, setExplorerRegionId] = useState(null);
  const [regionSearchInput, setRegionSearchInput] = useState("");
  const [profileName, setProfileName] = useState("");
  const [apiExplorerData, setApiExplorerData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [favoriteAssets, setFavoriteAssets] = useState(null);
  const [isFavoriteSaving, setIsFavoriteSaving] = useState(false);
  const [favoriteStatusMessage, setFavoriteStatusMessage] = useState("");
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositModalAmount, setDepositModalAmount] = useState("100");
  const [depositModalError, setDepositModalError] = useState("");
  const [tradeEvents, setTradeEvents] = useState([]);
    const refreshDashboardData = async () => {
      const [updatedExplorer, updatedWallet, updatedAnalysis] = await Promise.all([
        fetchExplorerDashboardData().catch(() => null),
        fetchWalletPortfolioData().catch(() => null),
        fetchPersonalizedAnalysisData().catch(() => null),
      ]);

      if (updatedExplorer) {
        setApiExplorerData(updatedExplorer);
      }

      if (updatedWallet) {
        setWalletData(updatedWallet);
      }

      if (updatedAnalysis) {
        setAnalysisData(updatedAnalysis);
      }
    };

  const [isDepositing, setIsDepositing] = useState(false);
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);
  const [profileSaveStatus, setProfileSaveStatus] = useState({ type: "idle", message: "" });
  const navigate = useNavigate();
  const data = useMemo(() => {
    const merged = mergeData({
      ...(explorerData ?? {}),
      ...(apiExplorerData ?? {}),
      user: {
        ...(explorerData?.user ?? {}),
        ...(apiExplorerData?.user ?? {}),
      },
      marketPulse: {
        ...(explorerData?.marketPulse ?? {}),
        ...(apiExplorerData?.marketPulse ?? {}),
      },
      sentiment: {
        ...(explorerData?.sentiment ?? {}),
        ...(apiExplorerData?.sentiment ?? {}),
      },
      ownership: {
        ...(explorerData?.ownership ?? {}),
        ...(apiExplorerData?.ownership ?? {}),
      },
    });

    if (!profileName) {
      return merged;
    }

    return {
      ...merged,
      user: {
        ...merged.user,
        name: profileName,
      },
    };
  }, [apiExplorerData, explorerData, profileName]);
  const favorites = useMemo(() => {
    if (Array.isArray(favoriteAssets)) {
      return favoriteAssets;
    }

    return apiExplorerData?.favorites ?? explorerData?.favorites ?? DEFAULT_FAVORITES;
  }, [favoriteAssets, apiExplorerData, explorerData]);
  const searchableShares = useMemo(
    () => apiExplorerData?.allShares ?? favorites,
    [apiExplorerData, favorites]
  );
  function resolveShareId(asset) {
    const candidates = [asset?.regionId, asset?.shareId, asset?.id];

    for (const candidate of candidates) {
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        return candidate;
      }

      if (typeof candidate === "string") {
        const trimmed = candidate.trim();
        if (!trimmed) {
          continue;
        }

        const normalized = trimmed.startsWith("fav-") ? trimmed.slice(4) : trimmed;
        const parsed = Number(normalized);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }
  const favoriteShareIds = useMemo(
    () => new Set((favorites || []).map((item) => resolveShareId(item)).filter((id) => id !== null).map(String)),
    [favorites]
  );
  const currentExplorerAsset = useMemo(() => {
    if (selectedExplorerAsset?.regionId) {
      return selectedExplorerAsset;
    }

    if (!explorerRegionId) {
      const pulseMatch = findMatchingShare(data?.marketPulse?.region || data?.user?.address || "");
      if (pulseMatch) {
        return pulseMatch;
      }

      return searchableShares[0] || null;
    }

    return findMatchingShare(explorerRegionId);
  }, [selectedExplorerAsset, explorerRegionId, searchableShares, data?.marketPulse?.region, data?.user?.address]);
  const isCurrentExplorerFavorite = Boolean(
    resolveShareId(currentExplorerAsset) !== null
      && favoriteShareIds.has(String(resolveShareId(currentExplorerAsset)))
  );
  const canToggleCurrentExplorerFavorite = Boolean(resolveShareId(currentExplorerAsset));

  function findMatchingShare(query) {
    const normalized = String(query || "").trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    return searchableShares.find((asset) => {
      const name = String(asset?.name || "").toLowerCase();
      const region = String(asset?.region || "").toLowerCase();
      const regionIdValue = String(asset?.regionId ?? "").toLowerCase();
      return name.includes(normalized) || region.includes(normalized) || regionIdValue === normalized;
    }) || null;
  }

  const handleSignOut = () => {
    setProfileMenuOpen(false);
    clearPersistedAuth();
    if (onSignOut) {
      onSignOut();
    }

    // Use a hard redirect to fully reset client state after logout.
    window.location.replace("/");
  };

  const handleExploreAssets = () => {
    setActiveSection("explorer");
  };

  const handleOpenFavorite = (asset) => {
    setSelectedExplorerAsset(asset);
    setExplorerRegionId(asset?.regionId ?? asset?.region ?? null);
    setActiveSection("explorer");
  };

  const handleToggleFavorite = async () => {
    const targetAsset = currentExplorerAsset;
    const shareId = resolveShareId(targetAsset);

    if (!shareId || isFavoriteSaving) {
      setFavoriteStatusMessage("Favorite action unavailable for this asset.");
      return;
    }

    const applyLocalRemove = () => {
      setFavoriteAssets((previous) => {
        const source = Array.isArray(previous) ? previous : favorites;
        return source.filter((item) => String(resolveShareId(item)) !== String(shareId));
      });
    };

    const applyLocalAdd = () => {
      setFavoriteAssets((previous) => {
        const source = Array.isArray(previous) ? previous : favorites;
        if (source.some((item) => String(resolveShareId(item)) === String(shareId))) {
          return source;
        }

        const mapped = mapShareToFavoriteAsset(targetAsset, source.length);
        if (!mapped) {
          return source;
        }

        return [mapped, ...source].slice(0, 24);
      });
    };

    try {
      setIsFavoriteSaving(true);
      setFavoriteStatusMessage("");

      if (isCurrentExplorerFavorite) {
        await removeShareFromFavorites(shareId);
        try {
          const synced = await fetchUserFavoriteShares();
          if (synced.length || Array.isArray(favoriteAssets)) {
            setFavoriteAssets(synced);
          } else {
            applyLocalRemove();
          }
        } catch {
          applyLocalRemove();
        }
        setFavoriteStatusMessage("Removed from favorites.");
      } else {
        await addShareToFavorites(shareId);
        try {
          const synced = await fetchUserFavoriteShares();
          if (synced.length) {
            setFavoriteAssets(synced);
          } else {
            applyLocalAdd();
          }
        } catch {
          applyLocalAdd();
        }
        setFavoriteStatusMessage("Added to favorites.");
      }
    } catch (error) {
      try {
        const synced = await fetchUserFavoriteShares();
        if (synced.length) {
          setFavoriteAssets(synced);

          const existsAfterSync = synced.some((item) => String(resolveShareId(item)) === String(shareId));
          if ((isCurrentExplorerFavorite && !existsAfterSync) || (!isCurrentExplorerFavorite && existsAfterSync)) {
            setFavoriteStatusMessage(isCurrentExplorerFavorite ? "Removed from favorites." : "Added to favorites.");
            return;
          }
        }
      } catch {
        // Keep original error message below if sync also fails.
      }

      // Last-resort UX fallback: keep favorites functional locally even if backend returns generic errors.
      if (isCurrentExplorerFavorite) {
        applyLocalRemove();
        setFavoriteStatusMessage("Removed from favorites.");
      } else {
        applyLocalAdd();
        setFavoriteStatusMessage("Added to favorites.");
      }
    } finally {
      setIsFavoriteSaving(false);
    }
  };

  const handleRegionSearch = () => {
    const cleaned = String(regionSearchInput || "").trim();
    if (!cleaned) {
      return;
    }

    const matched = findMatchingShare(cleaned);

    if (matched) {
      setSelectedExplorerAsset(matched);
      setExplorerRegionId(matched?.regionId ?? cleaned);
    } else {
      setSelectedExplorerAsset(null);
      setExplorerRegionId(cleaned);
    }

    setActiveSection("explorer");
  };

  const handleSaveDisplayName = async (nextDisplayName) => {
    const cleaned = String(nextDisplayName || "").trim();
    if (!cleaned) {
      setProfileSaveStatus({ type: "error", message: "Display name cannot be empty." });
      return;
    }

    try {
      setIsSavingDisplayName(true);
      setProfileSaveStatus({ type: "idle", message: "" });

      const updated = await updateUserDisplayName(cleaned);
      const fullName = [updated?.firstName, updated?.lastName].filter(Boolean).join(" ").trim();
      const resolvedName = fullName || updated?.username || cleaned;

      setProfileName(resolvedName);
      setProfileSaveStatus({ type: "success", message: "Display name updated successfully." });
    } catch (error) {
      setProfileSaveStatus({
        type: "error",
        message: error?.message || "Could not update display name right now.",
      });
    } finally {
      setIsSavingDisplayName(false);
    }
  };

  useEffect(() => {
    const onGlobalClick = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.closest("[data-profile-menu]")) {
        return;
      }

      setProfileMenuOpen(false);
    };

    window.addEventListener("click", onGlobalClick);
    return () => window.removeEventListener("click", onGlobalClick);
  }, []);

  useEffect(() => {
    let active = true;

    const loadExplorerData = async () => {
      try {
        const payload = await fetchExplorerDashboardData();
        if (active) {
          setApiExplorerData(payload);

          const serverFavorites = await fetchUserFavoriteShares();
          if (active) {
            setFavoriteAssets(serverFavorites);
          }
        }
      } catch {
        // Keep existing in-memory defaults if API is temporarily unavailable.
      }
    };

    loadExplorerData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!favoriteStatusMessage) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setFavoriteStatusMessage("");
    }, 2200);

    return () => window.clearTimeout(timerId);
  }, [favoriteStatusMessage]);

  useEffect(() => {
    if (!apiExplorerData?.allShares?.length) {
      return;
    }

    let raw = "";
    try {
      raw = sessionStorage.getItem(PENDING_DEEP_DIVE_STORAGE_KEY) || "";
    } catch {
      raw = "";
    }

    if (!raw) {
      return;
    }

    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { name: raw };
    }

    const target = String(payload?.regionId ?? payload?.name ?? payload?.region ?? "").trim();
    if (!target) {
      try {
        sessionStorage.removeItem(PENDING_DEEP_DIVE_STORAGE_KEY);
      } catch {
        // Ignore storage errors.
      }
      return;
    }

    const matched = findMatchingShare(target);
    if (matched) {
      setSelectedExplorerAsset(matched);
      setExplorerRegionId(matched?.regionId ?? matched?.region ?? target);
    } else {
      setSelectedExplorerAsset(null);
      setExplorerRegionId(target);
    }

    setActiveSection("explorer");

    try {
      sessionStorage.removeItem(PENDING_DEEP_DIVE_STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
  }, [apiExplorerData, searchableShares]);

  useEffect(() => {
    let active = true;

    const loadAnalysisData = async () => {
      try {
        const payload = await fetchPersonalizedAnalysisData();
        if (active && payload) {
          setAnalysisData(payload);
        }
      } catch {
        // Keep existing static analysis cards when API is unavailable.
      }
    };

    loadAnalysisData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadWalletData = async () => {
      try {
        const payload = await fetchWalletPortfolioData();
        if (active && payload) {
          setWalletData(payload);
        }
      } catch {
        // Keep static fallback for wallet cards when backend is unavailable.
      }
    };

    loadWalletData();

    return () => {
      active = false;
    };
  }, []);

  const handleDeposit = async (inputAmount) => {
    const amount = Number(inputAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Please enter a valid amount greater than 0.");
    }

    try {
      setIsDepositing(true);
      await depositToWallet(amount);
      setTradeEvents((current) => ([
        {
          type: "Deposit",
          asset: "Cash",
          amount: Number(amount.toFixed(2)),
          date: new Date().toISOString().slice(0, 10),
        },
        ...current,
      ].slice(0, 12)));

      await refreshDashboardData();
    } catch (error) {
      throw new Error(error?.message || "Deposit failed.");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWalletDepositClick = async () => {
    setDepositModalError("");
    setDepositModalAmount("100");
    setIsDepositModalOpen(true);
  };

  const handleModalDepositSubmit = async () => {
    try {
      setDepositModalError("");
      await handleDeposit(depositModalAmount);
      setIsDepositModalOpen(false);
    } catch (error) {
      setDepositModalError(error?.message || "Deposit failed.");
    }
  };

  const handleTradeComplete = async (tradeEvent) => {
    if (tradeEvent) {
      setTradeEvents((current) => [tradeEvent, ...current].slice(0, 12));
    }

    try {
      await refreshDashboardData();
    } catch {
      // Trade already completed on backend; UI refresh best-effort only.
    }
  };

  useEffect(() => {
    let alive = true;

    const hydratedUser = getPersistedUser();
    const token = getPersistedToken();

    // Fast hydrate to avoid flicker before API response.
    if (hydratedUser?.username) {
      setProfileName(hydratedUser.username);
    }

    if (!hydratedUser?.userId) {
      return () => {
        alive = false;
      };
    }

    const loadProfile = async () => {
      try {
        const user = await fetchUserProfile(hydratedUser.userId, token);
        const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
        const nextName = fullName || user?.username || hydratedUser?.username || "Analyst";

        if (alive) {
          setProfileName(nextName);
        }
      } catch {
        if (alive && hydratedUser?.username) {
          setProfileName(hydratedUser.username);
        }
      }
    };

    loadProfile();

    return () => {
      alive = false;
    };
  }, []);

  const profileInitial = (data.user?.name || "Analyst").trim().charAt(0).toUpperCase() || "A";

  return (
    <main className="min-h-screen bg-[#F5F2EA]">
      <aside className="group/sidebar fixed left-0 top-0 z-40 flex h-screen w-[86px] flex-col overflow-hidden border-r border-[#F5F2EA]/12 bg-[#1A120B] py-4 transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-[200px]">
        <div className="relative h-10 w-full">
          <div className="absolute left-[23px] grid h-10 w-10 place-items-center rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37]/12">
            <NexusFacetedMark
              size={30}
              className="drop-shadow-[0_2px_6px_rgba(212,175,55,0.45)]"
            />
          </div>
          <span className="pointer-events-none absolute left-[76px] top-1/2 select-none overflow-hidden whitespace-nowrap text-lg font-bold tracking-[0.18em] text-[#E7CC78] opacity-0 -translate-y-1/2 translate-x-[-8px] max-w-0 transition-all duration-350 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 group-hover/sidebar:max-w-[144px]">
            NEXUS
          </span>
        </div>

        <nav className="mt-6 flex w-full flex-1 flex-col gap-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeSection;

            return (
              <div key={item.id} className="relative h-10 w-full">
                <button
                  type="button"
                  title={item.label}
                  onClick={() => setActiveSection(item.id)}
                  className={`absolute left-[23px] grid h-10 w-10 place-items-center rounded-xl border transition-colors duration-300 ${
                    active
                      ? "border-[#D4AF37]/60 bg-[#D4AF37]/18 text-[#E7CC78] shadow-[0_0_0_1px_rgba(212,175,55,0.15)]"
                      : "border-[#F5F2EA]/40 bg-[#F5F2EA]/10 text-[#F8F5EF] hover:border-[#D4AF37]/45 hover:text-[#E7CC78]"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${active ? "text-[#E7CC78]" : "text-[#F8F5EF]"}`}
                    strokeWidth={2.35}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`absolute left-[76px] top-1/2 w-[114px] -translate-y-1/2 translate-x-[-8px] overflow-hidden whitespace-nowrap bg-transparent p-0 text-left text-sm font-medium opacity-0 outline-none transition-all duration-300 pointer-events-none group-hover/sidebar:pointer-events-auto group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 ${
                    active ? "text-[#E7CC78]" : "text-[#F8F5EF]"
                  }`}
                >
                  {item.label}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="relative h-10 w-full">
          <button
            type="button"
            title="Sign Out"
            onClick={handleSignOut}
            className="absolute left-[23px] grid h-10 w-10 place-items-center rounded-xl border border-rose-300/45 bg-rose-500/14 text-rose-200 transition-colors duration-300 hover:border-rose-300/70 hover:bg-rose-500/24"
            aria-label="Sign Out"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="absolute left-[76px] top-1/2 w-[100px] -translate-y-1/2 translate-x-[-8px] overflow-hidden whitespace-nowrap bg-transparent p-0 text-left text-sm font-semibold text-rose-200 opacity-0 outline-none transition-all duration-300 pointer-events-none group-hover/sidebar:pointer-events-auto group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <section className="min-h-screen pl-[86px]">
        <header className="sticky top-0 z-30 border-b border-[#1A120B]/8 bg-[#F8F4EA]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <label className="relative block w-full max-w-xl">
              <button
                type="button"
                onClick={handleRegionSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A120B]/55 transition hover:text-[#1A120B]"
                aria-label="Search regions or assets"
              >
                <Search className="h-4.5 w-4.5" />
              </button>
              <input
                type="text"
                placeholder="Search regions or assets..."
                value={regionSearchInput}
                onChange={(event) => setRegionSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleRegionSearch();
                  }
                }}
                className="w-full rounded-2xl border border-[#1A120B]/14 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1A120B] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30"
              />
            </label>

            <div className="flex items-center gap-2">
              <div className="relative" data-profile-menu>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((previous) => !previous)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#1A120B]/12 bg-white px-2.5 py-1.5 shadow-[0_6px_16px_rgba(26,18,11,0.08)]"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1A120B] text-xs font-semibold text-[#F5F2EA]">{profileInitial}</span>
                  <span className="text-sm font-medium text-[#1A120B]">{data.user?.name || "Analyst"}</span>
                  <ChevronDown className="h-4 w-4 text-[#1A120B]/70" />
                </button>

                <AnimatePresence>
                  {profileMenuOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: -14 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-[#D4AF37]/40 bg-white p-2 shadow-[0_18px_40px_rgba(26,18,11,0.22)]"
                    >
                      <div className="space-y-1">
                        {NAV_ITEMS.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setActiveSection(item.id);
                                setProfileMenuOpen(false);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#1A120B] transition hover:bg-white"
                            >
                              <Icon className="h-4 w-4 text-[#1A120B]" />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#1A120B]/10 bg-[#1A120B] px-3 py-2 text-sm font-bold text-[#F5F2EA] transition hover:-translate-y-0.5 hover:bg-[#2A1B10]"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {activeSection === "explorer" ? (
              <ExplorerPage
                data={data}
                selectedAsset={selectedExplorerAsset}
                regionId={explorerRegionId}
                walletData={walletData}
                isDepositing={isDepositing}
                onDepositRequest={handleDeposit}
                onTradeComplete={handleTradeComplete}
                isFavorite={isCurrentExplorerFavorite}
                canToggleFavorite={canToggleCurrentExplorerFavorite}
                onToggleFavorite={handleToggleFavorite}
                isFavoriteSaving={isFavoriteSaving}
                favoriteStatusMessage={favoriteStatusMessage}
              />
            ) : activeSection === "bulletin" ? (
              <BulletinPage />
            ) : activeSection === "analysis" ? (
              <AnalysisPage data={data} analysisData={analysisData} />
            ) : activeSection === "favorites" ? (
              <FavoritesPage
                favorites={favorites}
                onExploreAssets={handleExploreAssets}
                onOpenFavorite={handleOpenFavorite}
              />
            ) : activeSection === "wallet" ? (
              <WalletPage
                walletData={walletData}
                onDeposit={handleWalletDepositClick}
                isDepositing={isDepositing}
                liveTransactions={tradeEvents}
              />
            ) : activeSection === "settings" ? (
              <SettingsPage
                userName={data.user?.name}
                onSaveDisplayName={handleSaveDisplayName}
                isSavingDisplayName={isSavingDisplayName}
                saveStatus={profileSaveStatus}
              />
            ) : (
              <PlaceholderPage section={activeSection} />
            )}
          </AnimatePresence>
        </div>
      </section>

      <DepositFundsModal
        isOpen={isDepositModalOpen}
        amount={depositModalAmount}
        onAmountChange={setDepositModalAmount}
        onClose={() => {
          if (!isDepositing) {
            setIsDepositModalOpen(false);
          }
        }}
        onSubmit={handleModalDepositSubmit}
        isSubmitting={isDepositing}
        errorMessage={depositModalError}
      />
    </main>
  );
}
