import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const defaultDeepDivePayload = {
  tokenSymbol: "NXM",
  riskScore: 67,
  tokenPrice: 128.4,
  tokenChange24h: 2.9,
  ownershipProgress: 45,
  sentiment: {
    bullish: 71,
    bearish: 29,
  },
  priceHistory: [
    { month: "Oct", price: 101.2 },
    { month: "Nov", price: 109.6 },
    { month: "Dec", price: 106.8 },
    { month: "Jan", price: 119.3 },
    { month: "Feb", price: 122.5 },
    { month: "Mar", price: 128.4 },
  ],
  newsEvents: [
    {
      month: "Nov",
      price: 109.6,
      headline: "Municipal permit acceleration approved by local planning board.",
      aiSummary: "NLP score: construction certainty up, default risk down.",
    },
    {
      month: "Jan",
      price: 119.3,
      headline: "Foreign investment tax updated for district-backed renewables.",
      aiSummary: "NLP score: stronger near-term token demand likely.",
    },
    {
      month: "Mar",
      price: 128.4,
      headline: "Energy grid modernization tender secured by regional operator.",
      aiSummary: "NLP score: medium-term operating resilience improved.",
    },
  ],
  riskHistory: [
    { month: "Oct", risk: 61 },
    { month: "Nov", risk: 65 },
    { month: "Dec", risk: 59 },
    { month: "Jan", risk: 63 },
    { month: "Feb", risk: 66 },
    { month: "Mar", risk: 67 },
  ],
};

const containerVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

function NewsMarker({ cx, cy }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle r="8" fill="#1A120B" stroke="#D4AF37" strokeWidth="1.6" />
      <path d="M-2 -3 L2 -3 L2 1 L0 1 L-1.4 3 L-1.4 1 L-2 1 Z" fill="#F5F2EA" />
    </g>
  );
}

function HeaderTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const newsPoint = payload.find((entry) => entry?.payload?.headline);
  const pricePoint = payload.find((entry) => entry?.dataKey === "price");

  return (
    <div className="max-w-xs rounded-xl border border-[#D4AF37]/35 bg-[#1A120B]/95 px-3 py-2 text-xs text-[#F5F2EA] shadow-xl shadow-black/40">
      <p className="font-semibold uppercase tracking-[0.14em] text-[#E5C76D]">{label}</p>
      <p className="mt-1 text-sm font-semibold">
        ${Number(pricePoint?.value ?? 0).toFixed(2)}
      </p>
      {newsPoint ? (
        <>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#E5C76D]">
            AI News Trigger
          </p>
          <p className="mt-1 leading-relaxed">{newsPoint.payload.headline}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#F5F2EA]/78">
            {newsPoint.payload.aiSummary}
          </p>
        </>
      ) : null}
    </div>
  );
}

function getRiskBandClasses(score) {
  if (score <= 35) {
    return "bg-emerald-200 text-emerald-900";
  }

  if (score <= 70) {
    return "bg-amber-200 text-amber-900";
  }

  return "bg-rose-200 text-rose-900";
}

export default function AssetDeepDivePage({ asset, onBack }) {
  const [buyAmount, setBuyAmount] = useState("1200");
  const [sellAmount, setSellAmount] = useState("300");

  // Expected backend shape can provide `asset.deepDive`; this fallback keeps the widget contract stable.
  const deepDive = useMemo(() => {
    return {
      ...defaultDeepDivePayload,
      ...(asset?.deepDive ?? {}),
      sentiment: {
        ...defaultDeepDivePayload.sentiment,
        ...(asset?.deepDive?.sentiment ?? {}),
      },
      priceHistory:
        asset?.deepDive?.priceHistory ?? defaultDeepDivePayload.priceHistory,
      newsEvents: asset?.deepDive?.newsEvents ?? defaultDeepDivePayload.newsEvents,
      riskHistory: asset?.deepDive?.riskHistory ?? defaultDeepDivePayload.riskHistory,
    };
  }, [asset]);

  const isPositiveChange = deepDive.tokenChange24h >= 0;
  const regionName = asset?.region ?? asset?.name ?? "Berlin Mitte";

  return (
    <section className="relative overflow-hidden bg-[#F5F2EA] px-4 pb-10 pt-24 text-[#1A120B] sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_14%,rgba(212,175,55,0.22),transparent_34%),radial-gradient(circle_at_88%_88%,rgba(26,18,11,0.1),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(26,18,11,0.04)_1px,transparent_1px)] [background-size:92px_92px]" />

      <motion.div
        className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.55fr_0.85fr]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-6">
          <motion.header
            variants={itemVariants}
            className="rounded-3xl border border-[#1A120B]/15 bg-white/70 p-5 backdrop-blur-sm sm:p-7"
          >
            <button
              type="button"
              onClick={onBack}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#1A120B]/20 bg-white/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#1A120B] transition hover:border-[#D4AF37]/65 hover:text-[#9A781F]"
            >
              <span aria-hidden="true">←</span> Back To Dashboard
            </button>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1A120B]/60">
                  Asset Insight And Deep Dive
                </p>
                <h1
                  className="mt-2 text-3xl font-black leading-tight sm:text-4xl"
                  style={{ fontFamily: "Fraunces, 'Times New Roman', Georgia, serif" }}
                >
                  {regionName}
                </h1>
                <p className="mt-2 text-sm text-[#1A120B]/76">
                  Human + Machine intelligence for location-sensitive real estate token analytics.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${getRiskBandClasses(
                    deepDive.riskScore
                  )}`}
                >
                  Nexus Risk Score {deepDive.riskScore}
                </span>
                <span className="rounded-full border border-[#1A120B]/20 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1A120B]">
                  {deepDive.tokenSymbol} ${deepDive.tokenPrice.toFixed(2)}
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] ${
                    isPositiveChange
                      ? "bg-emerald-200 text-emerald-900"
                      : "bg-rose-200 text-rose-900"
                  }`}
                >
                  24h {isPositiveChange ? "+" : ""}
                  {deepDive.tokenChange24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </motion.header>

          <motion.article
            variants={itemVariants}
            className="rounded-3xl border border-[#1A120B]/15 bg-white/78 p-4 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-xl font-extrabold"
                style={{ fontFamily: "Fraunces, 'Times New Roman', Georgia, serif" }}
              >
                Price & News Correlation
              </h2>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A120B]/64">
                AI News Markers Enabled
              </span>
            </div>

            <div className="h-72 w-full sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={deepDive.priceHistory}>
                  <defs>
                    <linearGradient id="priceGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.34} />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1A120B" strokeDasharray="3 3" strokeOpacity={0.14} />
                  <XAxis dataKey="month" tick={{ fill: "#1A120B", fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: "#1A120B", fontSize: 12 }}
                    width={56}
                    domain={["dataMin - 5", "dataMax + 5"]}
                  />
                  <Tooltip content={<HeaderTooltip />} cursor={{ stroke: "#D4AF37", strokeOpacity: 0.45 }} />
                  <Area
                    dataKey="price"
                    type="monotone"
                    stroke="none"
                    fill="url(#priceGlow)"
                    fillOpacity={1}
                  />
                  <Line
                    dataKey="price"
                    type="monotone"
                    stroke="#1A120B"
                    strokeWidth={2.8}
                    dot={{ r: 2, strokeWidth: 0, fill: "#1A120B" }}
                    activeDot={{ r: 5, fill: "#D4AF37", stroke: "#1A120B", strokeWidth: 1.5 }}
                  />
                  <Scatter data={deepDive.newsEvents} shape={<NewsMarker />} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.article>

          <motion.article
            variants={itemVariants}
            className="rounded-3xl border border-[#1A120B]/15 bg-white/78 p-4 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-lg font-extrabold sm:text-xl"
                style={{ fontFamily: "Fraunces, 'Times New Roman', Georgia, serif" }}
              >
                Risk History Tracker
              </h2>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A120B]/64">
                Last 6 Months
              </span>
            </div>

            <div className="h-48 w-full sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={deepDive.riskHistory}>
                  <defs>
                    <linearGradient id="riskGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.65} />
                      <stop offset="50%" stopColor="#FACC15" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1A120B" strokeDasharray="4 4" strokeOpacity={0.14} />
                  <XAxis dataKey="month" tick={{ fill: "#1A120B", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#1A120B", fontSize: 12 }} width={50} domain={[0, 100]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke="#7F1D1D"
                    strokeWidth={2}
                    fill="url(#riskGradient)"
                    fillOpacity={1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.article>

          <motion.article
            variants={itemVariants}
            className="rounded-3xl border border-[#1A120B]/15 bg-white/78 p-5 sm:p-6"
          >
            <h2
              className="text-lg font-extrabold sm:text-xl"
              style={{ fontFamily: "Fraunces, 'Times New Roman', Georgia, serif" }}
            >
              AI Sentiment Dashboard
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#1A120B]/72">
              NLP pipeline combines municipal reports and regional news to classify momentum and governance impact.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-[#1A120B]/72">
                  <span>Bullish</span>
                  <span>{deepDive.sentiment.bullish}%</span>
                </div>
                <div className="h-3 rounded-full bg-emerald-100">
                  <div
                    className="h-3 rounded-full bg-emerald-500"
                    style={{ width: `${deepDive.sentiment.bullish}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-[#1A120B]/72">
                  <span>Bearish</span>
                  <span>{deepDive.sentiment.bearish}%</span>
                </div>
                <div className="h-3 rounded-full bg-rose-100">
                  <div
                    className="h-3 rounded-full bg-rose-500"
                    style={{ width: `${deepDive.sentiment.bearish}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.article>
        </div>

        <motion.aside variants={itemVariants} className="space-y-6">
          <div className="rounded-3xl border border-[#D4AF37]/25 bg-[#1A120B] p-5 text-[#F5F2EA] shadow-xl shadow-black/30 sm:p-6">
            <h3
              className="text-xl font-black"
              style={{ fontFamily: "Fraunces, 'Times New Roman', Georgia, serif" }}
            >
              Tokenomics & Action Center
            </h3>

            <div className="mt-5 space-y-4 rounded-2xl border border-[#D4AF37]/22 bg-white/5 p-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#E5C76D]">
                Trading Panel
              </h4>

              <label className="block text-xs uppercase tracking-[0.12em] text-[#F5F2EA]/74" htmlFor="buy-amount">
                Buy {deepDive.tokenSymbol}
              </label>
              <input
                id="buy-amount"
                type="number"
                min="0"
                value={buyAmount}
                onChange={(event) => setBuyAmount(event.target.value)}
                className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#F5F2EA]/95 px-3 py-2 text-sm text-[#1A120B] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/35"
              />

              <label className="block text-xs uppercase tracking-[0.12em] text-[#F5F2EA]/74" htmlFor="sell-amount">
                Sell {deepDive.tokenSymbol}
              </label>
              <input
                id="sell-amount"
                type="number"
                min="0"
                value={sellAmount}
                onChange={(event) => setSellAmount(event.target.value)}
                className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#F5F2EA]/95 px-3 py-2 text-sm text-[#1A120B] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/35"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:brightness-110"
                >
                  Buy
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:brightness-110"
                >
                  Sell
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#D4AF37]/22 bg-white/5 p-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#E5C76D]">
                Homeownership Tracker
              </h4>
              <div className="mt-4 flex items-center gap-4">
                <div
                  className="relative h-24 w-24 rounded-full"
                  style={{
                    background: `conic-gradient(#D4AF37 ${deepDive.ownershipProgress * 3.6}deg, rgba(245,242,234,0.18) 0deg)`,
                  }}
                >
                  <div className="absolute inset-[8px] grid place-items-center rounded-full bg-[#1A120B] text-lg font-extrabold text-[#F5F2EA]">
                    {deepDive.ownershipProgress}%
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-[#F5F2EA]/85">
                  You own {deepDive.ownershipProgress}% of the tokens required for physical property ownership in this region.
                </p>
              </div>
            </div>
          </div>
        </motion.aside>
      </motion.div>
    </section>
  );
}
