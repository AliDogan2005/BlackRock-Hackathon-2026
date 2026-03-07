import { useEffect, useState } from "react";
import LoginModal from "./LoginModal";

function NexusMiniIcon() {
  return (
    <svg viewBox="0 0 52 52" className="h-8 w-8" aria-hidden="true">
      <defs>
        <linearGradient id="miniGold" x1="26" y1="2" x2="26" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F5D97D" />
          <stop offset="1" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      <path d="M26 3 L38 18 L32 49 L20 49 L14 18 Z" fill="url(#miniGold)" stroke="#1A120B" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 35 L16 16 L26 26 L21 49 L6 49 Z" fill="#CCA13A" stroke="#1A120B" strokeWidth="2" strokeLinejoin="round" />
      <path d="M45 35 L36 16 L26 26 L31 49 L46 49 Z" fill="#CCA13A" stroke="#1A120B" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default function Header({ onLoginSuccess }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOnLightSection, setIsOnLightSection] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const smoothScrollTo = (hash, offset = 80) => {
    const target = document.querySelector(hash);

    if (!target) {
      return;
    }

    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const top = Math.max(targetTop - offset, 0);

    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleNavClick = (event, hash) => {
    event.preventDefault();
    smoothScrollTo(hash, 80);
  };

  const handleTopClick = (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const lightSectionIds = ["market", "risk-analyzer", "faq", "contact"];

    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);

      const probeY = 40;
      const isLight = lightSectionIds.some((id) => {
        const section = document.getElementById(id);

        if (!section) {
          return false;
        }

        const rect = section.getBoundingClientRect();
        return rect.top <= probeY && rect.bottom >= probeY;
      });

      setIsOnLightSection(isLight);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const navLinks = [
    { label: "Market", href: "#market" },
    { label: "Risk Analyzer", href: "#risk-analyzer" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-nexus-primary-espresso/58 backdrop-blur-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-16">
        <a href="#top" onClick={handleTopClick} className="flex items-center gap-3">
          <NexusMiniIcon />
          <span className="text-lg font-bold tracking-[0.08em] text-nexus-primary-beige">NEXUS</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(event) => handleNavClick(event, link.href)}
              className={`text-sm font-medium tracking-wide transition ${
                isOnLightSection
                  ? "text-nexus-primary-espresso/85 hover:text-nexus-primary-gold"
                  : "text-nexus-primary-beige/85 hover:text-nexus-primary-gold"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setIsAuthModalOpen(true);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isOnLightSection
                ? "border border-nexus-primary-espresso/30 text-nexus-primary-espresso hover:border-nexus-primary-gold/70 hover:text-nexus-primary-gold"
                : "border border-nexus-primary-beige/30 text-nexus-primary-beige hover:border-nexus-primary-gold/60 hover:text-nexus-primary-gold"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setIsAuthModalOpen(true);
            }}
            className="rounded-full bg-nexus-primary-gold px-4 py-2 text-sm font-semibold text-nexus-primary-espresso shadow-[0_8px_22px_rgba(212,175,55,0.3)] transition hover:brightness-105"
          >
            Register
          </button>
        </div>
      </div>

      <LoginModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={onLoginSuccess}
      />
    </header>
  );
}
