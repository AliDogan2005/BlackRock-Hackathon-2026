import { useState } from "react";
import Header from "./Header";
import HeroSection from "./HeroSection";
import HeroToLightTransition from "./HeroToLightTransition";
import WhatIsNexusSection from "./WhatIsNexusSection";
import AssetDashboard from "./AssetDashboard";
import FAQContactSection from "./FAQContactSection";
import LoginModal from "./LoginModal";

const PENDING_DEEP_DIVE_STORAGE_KEY = "nexus.pendingDeepDiveAsset";

export default function LandingPage({ onLoginSuccess }) {
  const [isExploreLoginOpen, setIsExploreLoginOpen] = useState(false);

  const handleExploreAssets = (asset) => {
    try {
      if (asset && (asset.name || asset.region || asset.regionId)) {
        sessionStorage.setItem(
          PENDING_DEEP_DIVE_STORAGE_KEY,
          JSON.stringify({
            name: asset.name ?? null,
            region: asset.region ?? null,
            regionId: asset.regionId ?? null,
          })
        );
      } else {
        sessionStorage.removeItem(PENDING_DEEP_DIVE_STORAGE_KEY);
      }
    } catch {
      // Ignore sessionStorage errors and continue with login flow.
    }

    setIsExploreLoginOpen(true);
  };

  const handleExploreLoginSuccess = (payload) => {
    setIsExploreLoginOpen(false);
    if (onLoginSuccess) {
      onLoginSuccess(payload);
    }
  };

  return (
    <main className="min-h-screen bg-nexus-primary-beige text-nexus-primary-espresso">
      <Header onLoginSuccess={onLoginSuccess} />
      <HeroSection onExploreAssets={handleExploreAssets} />
      <HeroToLightTransition />
      <WhatIsNexusSection />
      <AssetDashboard onOpenDeepDive={handleExploreAssets} />
      <FAQContactSection />

      <LoginModal
        isOpen={isExploreLoginOpen}
        initialMode="login"
        onClose={() => setIsExploreLoginOpen(false)}
        onSuccess={handleExploreLoginSuccess}
      />
    </main>
  );
}
