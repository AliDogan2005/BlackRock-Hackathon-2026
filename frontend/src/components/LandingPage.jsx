import Header from "./Header";
import HeroSection from "./HeroSection";
import HeroToLightTransition from "./HeroToLightTransition";
import WhatIsNexusSection from "./WhatIsNexusSection";
import AssetDashboard from "./AssetDashboard";
import FAQContactSection from "./FAQContactSection";

export default function LandingPage({ onLoginSuccess }) {
  return (
    <main className="min-h-screen bg-nexus-primary-beige text-nexus-primary-espresso">
      <Header onLoginSuccess={onLoginSuccess} />
      <HeroSection />
      <HeroToLightTransition />
      <WhatIsNexusSection />
      <AssetDashboard />
      <FAQContactSection />
    </main>
  );
}
