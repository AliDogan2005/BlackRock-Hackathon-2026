export default function NexusLogoMark({
  size = 280,
  mode = "dark",
  className = "",
  showWordmark = true,
  backgroundColor,
}) {
  const palette = {
    gold: "#D4AF37",
    espresso: "#1A120B",
    beige: "#F5F2EA",
    white: "#FFFFFF",
  };

  const isDark = mode === "dark";
  const background = backgroundColor || (isDark ? palette.espresso : palette.beige);
  const stroke = isDark ? "#1F140C" : palette.espresso;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        background,
        borderRadius: 28,
        display: "grid",
        placeItems: "center",
      }}
      aria-label="NEXUS logo mark"
      role="img"
    >
      <svg
        width={Math.round(size * 0.82)}
        height={Math.round(size * 0.82)}
        viewBox={showWordmark ? "0 0 420 420" : "0 0 420 290"}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="bgHalo" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(210 148) rotate(90) scale(136)">
            <stop offset="0" stopColor="#D4AF37" stopOpacity="0.3" />
            <stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="goldMain" x1="210" y1="56" x2="210" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F6E39F" />
            <stop offset="0.46" stopColor="#E4C462" />
            <stop offset="1" stopColor="#B98F25" />
          </linearGradient>

          <linearGradient id="goldSideL" x1="92" y1="130" x2="132" y2="246" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#EFD17A" />
            <stop offset="1" stopColor="#B1851F" />
          </linearGradient>

          <linearGradient id="goldSideR" x1="328" y1="130" x2="288" y2="246" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#EFD17A" />
            <stop offset="1" stopColor="#B1851F" />
          </linearGradient>

          <linearGradient id="wordmarkGold" x1="72" y1="280" x2="345" y2="362" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#EBCB72" />
            <stop offset="1" stopColor="#C49A2C" />
          </linearGradient>
        </defs>

        <ellipse cx="210" cy="148" rx="144" ry="120" fill="url(#bgHalo)" />

        <path
          d="M74 220 L112 126 L154 162 L138 256 L68 256 Z"
          fill="url(#goldSideL)"
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M112 126 L128 158 L94 174 Z" fill="#FAEAB8" fillOpacity="0.58" />
        <path d="M94 174 L128 158 L114 212 L84 212 Z" fill="#8A6514" fillOpacity="0.42" />
        <path d="M114 212 L138 256 L84 250 Z" fill="#76560F" fillOpacity="0.58" />
        <path d="M128 158 L154 162 L114 212 Z" fill="#D2AB43" fillOpacity="0.45" />

        <path
          d="M346 220 L308 126 L266 162 L282 256 L352 256 Z"
          fill="url(#goldSideR)"
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M308 126 L292 158 L326 174 Z" fill="#FAEAB8" fillOpacity="0.58" />
        <path d="M326 174 L292 158 L306 212 L336 212 Z" fill="#8A6514" fillOpacity="0.42" />
        <path d="M306 212 L282 256 L336 250 Z" fill="#76560F" fillOpacity="0.58" />
        <path d="M292 158 L266 162 L306 212 Z" fill="#D2AB43" fillOpacity="0.45" />

        <path
          d="M210 56 L262 148 L238 278 L182 278 L158 148 Z"
          fill="url(#goldMain)"
          stroke={stroke}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M210 56 L228 94 L192 94 Z" fill="#FFF0C2" fillOpacity="0.72" />
        <path d="M192 94 L228 94 L210 148 Z" fill="#EDD07A" fillOpacity="0.72" />
        <path d="M158 148 L192 94 L210 148 Z" fill="#CEAA48" fillOpacity="0.56" />
        <path d="M262 148 L228 94 L210 148 Z" fill="#CEAA48" fillOpacity="0.56" />
        <path d="M158 148 L210 148 L182 278 Z" fill="#9A7218" fillOpacity="0.48" />
        <path d="M262 148 L210 148 L238 278 Z" fill="#9A7218" fillOpacity="0.48" />
        <path d="M210 148 L182 278 L238 278 Z" fill="#78560F" fillOpacity="0.62" />

        <path
          d="M110 214 Q210 122 310 214"
          stroke="#F3DA94"
          strokeOpacity="0.22"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {showWordmark ? (
          <>
            <text
              x="210"
              y="338"
              textAnchor="middle"
              fontFamily="Segoe UI, Helvetica Neue, sans-serif"
              fontSize="74"
              fontWeight="800"
              letterSpacing="4"
              fill="url(#wordmarkGold)"
            >
              NEXUS
            </text>
            <text
              x="210"
              y="374"
              textAnchor="middle"
              fontFamily="Segoe UI, Helvetica Neue, sans-serif"
              fontSize="20"
              fontWeight="500"
              letterSpacing="1"
              fill="#CDAE62"
              opacity="0.92"
            >
              Fractional Investing Platform
            </text>
          </>
        ) : null}
      </svg>
    </div>
  );
}
