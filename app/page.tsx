import HeroSection from '@/features/landing/components/HeroSection'
import FeaturesSection from '@/features/landing/components/FeaturesSection'
import FooterSection from '@/features/landing/components/FooterSection'
import BackgroundEffects from '@/features/landing/components/BackgroundEffects'

export default function Home() {
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
