import { motion } from "framer-motion";
import { useId } from "react";

export default function NexusFacetedMark({
  size = 76,
  className = "",
  split = false,
  whiteout = false,
  splitDuration = 0.62,
}) {
  const id = useId().replace(/:/g, "");
  const mainGrad = `nexus-main-${id}`;
  const sideGrad = `nexus-side-${id}`;
  const facetGrad = `nexus-facet-${id}`;
  const glowGrad = `nexus-glow-${id}`;
  const whiteGrad = `nexus-white-${id}`;

  const shardTransition = { duration: splitDuration, ease: [0.16, 1, 0.3, 1] };
  const sideFill = whiteout ? `url(#${whiteGrad})` : `url(#${sideGrad})`;
  const mainFill = whiteout ? `url(#${whiteGrad})` : `url(#${mainGrad})`;
  const strokeColor = whiteout ? "#FFFFFF" : "#1A120B";

  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={glowGrad} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(64 62) rotate(90) scale(48)">
          <stop offset="0" stopColor="#D4AF37" stopOpacity="0.28" />
          <stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={mainGrad} x1="64" y1="18" x2="64" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F6E39F" />
          <stop offset="0.44" stopColor="#E4C462" />
          <stop offset="1" stopColor="#B98F25" />
        </linearGradient>
        <linearGradient id={sideGrad} x1="18" y1="40" x2="44" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#EFD17A" />
          <stop offset="1" stopColor="#B1851F" />
        </linearGradient>
        <linearGradient id={facetGrad} x1="32" y1="36" x2="96" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF0C2" stopOpacity="0.76" />
          <stop offset="1" stopColor="#C7992C" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={whiteGrad} x1="64" y1="20" x2="64" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.96" />
        </linearGradient>
      </defs>

      <ellipse cx="64" cy="62" rx="54" ry="44" fill={whiteout ? "#FFFFFF" : `url(#${glowGrad})`} />

      <motion.g
        animate={{
          x: split ? -170 : 0,
          y: split ? 24 : 0,
          opacity: split ? 0 : 1,
        }}
        transition={shardTransition}
      >
        <path d="M14 94L30 44L48 60L42 106L10 106Z" fill={sideFill} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        <path d="M30 44L36 56L22 62Z" fill={whiteout ? "#FFFFFF" : "#FAEAB8"} fillOpacity={whiteout ? 1 : 0.58} />
        <path d="M22 62L36 56L30 78L18 78Z" fill={whiteout ? "#FFFFFF" : "#8A6514"} fillOpacity={whiteout ? 0.95 : 0.42} />
        <path d="M36 56L48 60L30 78Z" fill={whiteout ? "#FFFFFF" : "#D2AB43"} fillOpacity={whiteout ? 0.95 : 0.46} />
      </motion.g>

      <motion.g
        animate={{
          y: split ? -150 : 0,
          opacity: split ? 0 : 1,
        }}
        transition={shardTransition}
      >
        <path d="M64 18L86 58L76 112L52 112L42 58Z" fill={mainFill} stroke={strokeColor} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M64 18L72 34L56 34Z" fill={whiteout ? "#FFFFFF" : "#FFF0C2"} fillOpacity={whiteout ? 1 : 0.72} />
        <path d="M56 34L72 34L64 58Z" fill={whiteout ? "#FFFFFF" : "#EDD07A"} fillOpacity={whiteout ? 0.98 : 0.74} />
        <path d="M42 58L56 34L64 58Z" fill={whiteout ? "#FFFFFF" : "#CEAA48"} fillOpacity={whiteout ? 0.95 : 0.56} />
        <path d="M86 58L72 34L64 58Z" fill={whiteout ? "#FFFFFF" : "#CEAA48"} fillOpacity={whiteout ? 0.95 : 0.56} />
        <path d="M42 58L64 58L52 112Z" fill={whiteout ? "#FFFFFF" : "#9A7218"} fillOpacity={whiteout ? 0.92 : 0.48} />
        <path d="M86 58L64 58L76 112Z" fill={whiteout ? "#FFFFFF" : "#9A7218"} fillOpacity={whiteout ? 0.92 : 0.48} />
        <path d="M64 58L52 112L76 112Z" fill={whiteout ? "#FFFFFF" : "#78560F"} fillOpacity={whiteout ? 0.9 : 0.62} />
      </motion.g>

      <motion.g
        animate={{
          x: split ? 170 : 0,
          y: split ? 24 : 0,
          opacity: split ? 0 : 1,
        }}
        transition={shardTransition}
      >
        <path d="M114 94L98 44L80 60L86 106L118 106Z" fill={sideFill} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        <path d="M98 44L92 56L106 62Z" fill={whiteout ? "#FFFFFF" : "#FAEAB8"} fillOpacity={whiteout ? 1 : 0.58} />
        <path d="M106 62L92 56L98 78L110 78Z" fill={whiteout ? "#FFFFFF" : "#8A6514"} fillOpacity={whiteout ? 0.95 : 0.42} />
        <path d="M92 56L80 60L98 78Z" fill={whiteout ? "#FFFFFF" : "#D2AB43"} fillOpacity={whiteout ? 0.95 : 0.46} />
      </motion.g>

      <path d="M24 92Q64 52 104 92" stroke={whiteout ? "#FFFFFF" : `url(#${facetGrad})`} strokeWidth="2" strokeLinecap="round" opacity={whiteout ? 0.9 : 0.44} />
    </svg>
  );
}
