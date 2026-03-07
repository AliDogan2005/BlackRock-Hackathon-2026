import { useState } from "react";
import Header from "./Header";
import HeroSection from "./HeroSection";
import HeroToLightTransition from "./HeroToLightTransition";
import WhatIsNexusSection from "./WhatIsNexusSection";
import AssetDashboard from "./AssetDashboard";
import FAQContactSection from "./FAQContactSection";
import LoginModal from "./LoginModal";

export default function LandingPage({ onLoginSuccess }) {
  const [isExploreLoginOpen, setIsExploreLoginOpen] = useState(false);

  const handleExploreAssets = () => {
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
      <AssetDashboard />
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
