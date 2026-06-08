import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import FooterSection from "./components/FooterSection";
import BackgroundEffects from "./components/BackgroundEffects";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen flex flex-col bg-[#f3f5f9] text-[#152033]">
      <BackgroundEffects />
      <div className="flex-1">
        <HeroSection />
        <FeaturesSection />
      </div>
      <FooterSection />
    </main>
  );
}
