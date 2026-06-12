import HeroSection from './components/HeroSection'
import FeaturesSection from './components/FeaturesSection'
import FooterSection from './components/FooterSection'
import BackgroundEffects from './components/BackgroundEffects'

export default function LandingPage() {
  return (
    <main className="relative min-h-screen flex flex-col bg-[#faf9f7] text-[#0a0e1a]">
      <BackgroundEffects />
      <div className="flex-1">
        <HeroSection />
        <FeaturesSection />
      </div>
      <FooterSection />
    </main>
  )
}
