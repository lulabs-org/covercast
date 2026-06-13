'use client'

import { useEffect, useRef, useState } from 'react'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  index: number
  accent?: 'blue' | 'violet' | 'gold'
}

const accentMap = {
  blue: {
    iconBg: 'rgba(201,168,124,0.1)',
    iconColor: '#c9a87c',
    borderHover: 'rgba(201,168,124,0.3)',
    glow: 'rgba(201,168,124,0.06)',
  },
  violet: {
    iconBg: 'rgba(180,140,90,0.1)',
    iconColor: '#b48c5a',
    borderHover: 'rgba(180,140,90,0.3)',
    glow: 'rgba(180,140,90,0.06)',
  },
  gold: {
    iconBg: 'rgba(201,168,124,0.1)',
    iconColor: '#c9a87c',
    borderHover: 'rgba(201,168,124,0.3)',
    glow: 'rgba(201,168,124,0.06)',
  },
}

export default function FeatureCard({
  icon,
  title,
  description,
  index,
  accent = 'blue',
}: FeatureCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  const a = accentMap[accent]

  return (
    <div
      ref={cardRef}
      className={`group relative flex flex-col items-start p-8 rounded-none
                  bg-[rgba(255,255,255,0.5)] backdrop-blur-md
                  border border-[rgba(201,168,124,0.12)]
                  transition-all duration-500 ease-out
                  hover:bg-[rgba(255,255,255,0.7)] hover:border-[${a.borderHover}]
                  hover:shadow-[0_16px_48px_${a.glow}] hover:-translate-y-1.5
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Top gradient line on hover */}
      <div
        className="absolute top-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(to right, transparent, ${a.iconColor}, transparent)`,
        }}
      />

      {/* Icon */}
      <div
        className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-none text-lg font-bold transition-all duration-300 group-hover:scale-110"
        style={{ backgroundColor: a.iconBg, color: a.iconColor }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-[18px] font-bold text-[#0a0e1a] mb-2.5 tracking-tight">{title}</h3>

      {/* Description */}
      <p className="text-[14px] leading-[1.75] text-[#64748b]">{description}</p>

      {/* Subtle corner accent */}
      <div
        className="absolute bottom-0 right-0 w-24 h-24 rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 100%, ${a.glow}, transparent 70%)`,
        }}
      />
    </div>
  )
}
