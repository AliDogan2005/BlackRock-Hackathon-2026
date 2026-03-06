import { motion } from "framer-motion";
import useAssetData from "../hooks/useAssetData";

const defaultAssets = [
  {
    name: "Antalya Solar Farm",
    riskScore: 82,
    roi: 14.6,
  },
  {
    name: "Milan Logistics Fleet",
    riskScore: 63,
    roi: 10.2,
  },
  {
    name: "Lisbon Prime Residences",
    riskScore: 41,
    roi: 7.4,
  },
  {
    name: "Dubai Cold Chain Hub",
    riskScore: 27,
    roi: 5.8,
  },
];

function getRiskBadgeClasses(score) {
  if (score >= 75) {
    return "border-emerald-400/45 bg-emerald-400/15 text-emerald-200";
  }

  if (score >= 50) {
    return "border-amber-400/50 bg-amber-300/15 text-amber-100";
  }

  return "border-rose-400/45 bg-rose-400/15 text-rose-200";
}

function getRoiClasses(value) {
  if (value > 0) {
    return "text-emerald-300";
  }

  if (value < 0) {
    return "text-rose-300";
  }

  return "text-nexus-primary-beige";
}

function formatRoi(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

const cardGridVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.14,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 26,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function AssetDashboard() {
  const { assets: dataAssets, loading, error } = useAssetData(
    "http://localhost:8080/api/assets",
    defaultAssets
  );

  const skeletonCards = Array.from({ length: 4 }, (_, idx) => idx);

  return (
    <section id="risk-analyzer" className="px-6 py-16 sm:px-10 lg:px-16">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-nexus-primary-gold/30 bg-nexus-primary-espresso p-6 shadow-2xl shadow-black/40 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_12%,rgba(212,175,55,0.18),transparent_38%),radial-gradient(circle_at_88%_80%,rgba(212,175,55,0.08),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(245,242,234,0.03)_1px,transparent_1px)] [background-size:140px_140px]" />

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nexus-primary-gold/85">
              NEXUS Dashboard
            </p>
            <h2 className="mt-2 bg-gradient-to-r from-[#f6e39f] via-[#d4af37] to-[#be9224] bg-clip-text text-2xl font-black text-transparent sm:text-3xl [font-family:'Sora','Manrope','Segoe_UI',sans-serif]">
              Financial Asset Monitor
            </h2>
          </div>

          <p className="rounded-full border border-nexus-primary-gold/55 bg-nexus-primary-gold/16 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-nexus-primary-gold">
            Live Portfolio Signals
          </p>
        </div>

        <motion.div
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
          variants={cardGridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}
        >
          {loading
            ? skeletonCards.map((index) => (
                <motion.article
                  key={`skeleton-${index}`}
                  variants={cardVariants}
                  className="relative overflow-hidden rounded-2xl border border-nexus-primary-gold/20 bg-gradient-to-b from-[#2b1d14]/95 via-[#23180f]/92 to-[#1c130d]/95 p-5"
                >
                  <div className="mb-6 h-5 w-3/4 animate-pulse rounded bg-nexus-primary-beige/20" />
                  <div className="mt-5 flex items-center justify-between">
                    <div className="h-3 w-28 animate-pulse rounded bg-nexus-primary-beige/15" />
                    <div className="h-6 w-12 animate-pulse rounded-full bg-nexus-primary-beige/20" />
                  </div>
                  <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-nexus-primary-gold/25 to-transparent" />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="h-3 w-10 animate-pulse rounded bg-nexus-primary-beige/15" />
                    <div className="h-7 w-16 animate-pulse rounded bg-nexus-primary-beige/25" />
                  </div>
                </motion.article>
              ))
            : dataAssets.map((asset) => (
                <motion.article
                  key={asset.name}
                  variants={cardVariants}
                  className="group relative overflow-hidden rounded-2xl border border-nexus-primary-gold/25 bg-gradient-to-b from-[#2b1d14]/95 via-[#23180f]/92 to-[#1c130d]/95 p-5 transition duration-300 hover:scale-[1.02] hover:border-nexus-primary-gold/55"
                >
                  <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-20 rotate-[24deg] border border-nexus-primary-gold/25 bg-nexus-primary-gold/10 [clip-path:polygon(50%_0%,100%_30%,84%_100%,16%_100%,0%_30%)]" />
                  <div className="pointer-events-none absolute -left-8 bottom-1 h-20 w-16 -rotate-[16deg] border border-nexus-primary-beige/10 bg-white/5 [clip-path:polygon(50%_0%,100%_30%,82%_100%,18%_100%,0%_30%)]" />

                  <h3 className="text-lg font-semibold leading-snug text-nexus-primary-white">
                    {asset.name}
                  </h3>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-nexus-primary-beige/75">
                      Nexus Risk Score
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold transition duration-300 group-hover:animate-pulse ${getRiskBadgeClasses(
                        asset.riskScore
                      )}`}
                    >
                      {asset.riskScore}
                    </span>
                  </div>

                  <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-nexus-primary-gold/35 to-transparent" />

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-nexus-primary-beige/75">
                      ROI
                    </span>
                    <span className={`text-2xl font-black ${getRoiClasses(asset.roi)}`}>
                      {formatRoi(asset.roi)}
                    </span>
                  </div>
                </motion.article>
              ))}
        </motion.div>

        {error ? (
          <p className="mt-5 text-xs font-medium text-nexus-primary-beige/65">
            Backend unavailable. Showing cached sample assets.
          </p>
        ) : null}
      </div>
    </section>
  );
}
