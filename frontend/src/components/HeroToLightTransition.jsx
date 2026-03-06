import { useEffect, useMemo, useRef, useState } from "react";
import {
  GRID_LAYER_OPACITY,
  GRID_UNIT,
  GRID_X_NUDGE,
  GRID_Y_NUDGE,
} from "../constants/gridAlignment";

export default function HeroToLightTransition() {
  const [phaseOffset, setPhaseOffset] = useState(0);
  const [waveWidth, setWaveWidth] = useState(1440);
  const sectionRef = useRef(null);

  const wavePath = useMemo(() => {
    const baseWidth = 1440;
    const scaleX = waveWidth / baseWidth;
    const sx = (value) => Math.round(value * scaleX * 100) / 100;

    return [
      `M0 110`,
      `C${sx(220)} 180,${sx(490)} 84,${sx(760)} 132`,
      `C${sx(1010)} 176,${sx(1210)} 150,${sx(1440)} 104`,
      `L${sx(1440)} 200`,
      `L0 200 Z`,
    ].join(" ");
  }, [waveWidth]);

  useEffect(() => {
    let rafId = 0;
    let heroObserver;
    let sectionObserver;

    const syncPhase = (hero) => {
      if (!hero) {
        return;
      }

      const heroHeight = hero.getBoundingClientRect().height;
      setPhaseOffset(heroHeight % GRID_UNIT);
    };

    const syncLayout = () => {
      const hero = document.getElementById("top");

      if (!hero) {
        setPhaseOffset(0);
      } else {
        syncPhase(hero);
      }

      const sectionEl = sectionRef.current;
      if (sectionEl) {
        setWaveWidth(sectionEl.getBoundingClientRect().width || 1440);
      }

      if (!heroObserver && hero && "ResizeObserver" in window) {
        heroObserver = new ResizeObserver(() => {
          syncPhase(hero);
        });
        heroObserver.observe(hero);
      }

      if (!sectionObserver && sectionRef.current && "ResizeObserver" in window) {
        sectionObserver = new ResizeObserver(() => {
          const width = sectionRef.current?.getBoundingClientRect().width || 1440;
          setWaveWidth(width);
        });
        sectionObserver.observe(sectionRef.current);
      }
    };

    syncLayout();
    rafId = window.requestAnimationFrame(syncLayout);
    window.addEventListener("resize", syncLayout);

    return () => {
      window.removeEventListener("resize", syncLayout);
      window.cancelAnimationFrame(rafId);
      if (heroObserver) {
        heroObserver.disconnect();
      }
      if (sectionObserver) {
        sectionObserver.disconnect();
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-hidden="true"
      className="relative -mt-[1px] h-[200px] overflow-hidden bg-nexus-primary-espresso"
    >
      <svg
        className="absolute inset-0 z-10 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="nexusGrid"
            width={GRID_UNIT}
            height={GRID_UNIT}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${GRID_X_NUDGE} ${phaseOffset + GRID_Y_NUDGE})`}
          >
            <path d="M0 0V56" stroke="#F2E8A1" strokeOpacity="0.14" strokeWidth="1" />
            <path d="M0 0H56" stroke="#F2E8A1" strokeOpacity="0.1" strokeWidth="1" />
          </pattern>

          <linearGradient id="transitionGridFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="0.34" />
            <stop offset="0.52" stopColor="white" stopOpacity="0.2" />
            <stop offset="1" stopColor="white" stopOpacity="0.08" />
          </linearGradient>

          <mask id="waveCutMask">
            <rect width="100%" height="100%" fill="url(#transitionGridFade)" />
            <path d={wavePath} fill="black" />
          </mask>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#nexusGrid)"
          opacity={GRID_LAYER_OPACITY}
          mask="url(#waveCutMask)"
        />

        <path d={wavePath} fill="#F5F2EA" />
      </svg>
    </section>
  );
}
