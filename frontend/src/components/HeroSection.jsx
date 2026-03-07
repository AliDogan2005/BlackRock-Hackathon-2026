import { motion } from "framer-motion";
import NexusLogoMark from "./NexusLogoMark";
import {
  GRID_LAYER_OPACITY,
  GRID_UNIT,
  GRID_X_NUDGE,
  GRID_Y_NUDGE,
} from "../constants/gridAlignment";

const heroContainer = {
  hidden: { opacity: 0, y: 34 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HeroSection({ onExploreAssets }) {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-nexus-primary-espresso px-6 pb-24 pt-28 text-nexus-primary-white sm:px-10 lg:px-16 lg:pb-28 lg:pt-32">
      <div className="pointer-events-none absolute inset-0">
        <svg
          className="absolute inset-0 h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="heroGridPattern"
              width={GRID_UNIT}
              height={GRID_UNIT}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${GRID_X_NUDGE} ${GRID_Y_NUDGE})`}
            >
              <path d="M0 0V56" stroke="#F2E8A1" strokeOpacity="0.14" strokeWidth="1" />
              <path d="M0 0H56" stroke="#F2E8A1" strokeOpacity="0.1" strokeWidth="1" />
            </pattern>

            <linearGradient id="heroGridFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity="1" />
              <stop offset="0.88" stopColor="white" stopOpacity="0.78" />
              <stop offset="1" stopColor="white" stopOpacity="0.34" />
            </linearGradient>

            <mask id="heroGridMask">
              <rect width="100%" height="100%" fill="url(#heroGridFade)" />
            </mask>
          </defs>

          <rect
            width="100%"
            height="100%"
            fill="url(#heroGridPattern)"
            opacity={GRID_LAYER_OPACITY}
            mask="url(#heroGridMask)"
          />
        </svg>
      </div>

      <motion.div
        variants={heroContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        className="relative mx-auto grid w-full max-w-7xl items-start gap-14 md:grid-cols-[0.4fr_0.6fr] lg:gap-28"
      >
        <div className="relative self-start md:pl-6 md:pt-4 lg:pl-10">
          <motion.div variants={heroItem} className="mb-3">
            <NexusLogoMark
              size={236}
              mode="dark"
              showWordmark={false}
              className="drop-shadow-[0_20px_36px_rgba(212,175,55,0.22)]"
            />
          </motion.div>

          <motion.p
            variants={heroItem}
            className="-mt-2 text-6xl font-black uppercase leading-none tracking-[0.11em] text-nexus-primary-gold sm:text-7xl lg:text-8xl [font-family:'Bodoni_Moda','Times_New_Roman',serif]"
          >
            NEXUS
          </motion.p>
        </div>

        <motion.div variants={heroItem} className="relative flex flex-col items-start md:items-end md:self-center md:text-right">
          <div className="w-full max-w-2xl rounded-3xl border border-nexus-primary-straw-yellow/22 bg-white/10 p-6 shadow-2xl shadow-black/35 md:ml-auto md:max-w-xl lg:max-w-2xl lg:p-8">
            <h1 className="text-4xl font-black leading-tight text-nexus-primary-beige sm:text-5xl lg:text-[3.3rem] [font-family:'Sora','Manrope','Segoe_UI',sans-serif]">
              The Future of Homeownership: Geometric Saving, Physical Reality.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-nexus-primary-beige/82 sm:text-lg">
              Invest in geographical real estate tokens with Human + Machine AI-driven precision. Build your fractional portfolio to unlock your physical home with zero credit barriers.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4 md:justify-end">
              <button
                type="button"
                onClick={onExploreAssets}
                className="rounded-full bg-nexus-primary-gold px-7 py-3 text-sm font-semibold text-nexus-primary-espresso shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition duration-300 ease-premium hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-primary-gold focus-visible:ring-offset-2 focus-visible:ring-offset-nexus-primary-espresso"
              >
                Explore Assets
              </button>

              <button
                type="button"
                className="rounded-full border border-nexus-primary-beige/35 px-7 py-3 text-sm font-semibold text-nexus-primary-beige transition duration-300 ease-premium hover:border-nexus-primary-gold/65 hover:text-nexus-primary-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-primary-gold focus-visible:ring-offset-2 focus-visible:ring-offset-nexus-primary-espresso"
              >
                Learn More
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
