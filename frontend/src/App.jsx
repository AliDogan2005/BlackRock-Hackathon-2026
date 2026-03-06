import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import HeroToLightTransition from "./components/HeroToLightTransition";
import WhatIsNexusSection from "./components/WhatIsNexusSection";
import AssetDashboard from "./components/AssetDashboard";
import FAQContactSection from "./components/FAQContactSection";

export default function App() {
  return (
    <main className="min-h-screen bg-nexus-primary-beige text-nexus-primary-espresso">
      <Header />
      <HeroSection />
      <HeroToLightTransition />
      <WhatIsNexusSection />
      <AssetDashboard />
      <FAQContactSection />
    </main>
  );
}
