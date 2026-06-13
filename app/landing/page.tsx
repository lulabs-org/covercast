import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import FooterSection from '@/components/landing/FooterSection'
import BackgroundEffects from '@/components/landing/BackgroundEffects'

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
  )
}
