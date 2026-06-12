'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 md:pt-44 md:pb-36 min-h-[90vh]"
      aria-label="Covercast封面编辑器介绍"
    >
      {/* Decorative ring behind logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
        <div className="absolute inset-0 rounded-full border border-[rgba(201,168,124,0.12)] animate-[spin_60s_linear_infinite]" />
        <div className="absolute inset-8 rounded-full border border-[rgba(79,109,245,0.08)] animate-[spin_45s_linear_infinite_reverse]" />
        <div className="absolute inset-16 rounded-full border border-dashed border-[rgba(201,168,124,0.06)] animate-[spin_90s_linear_infinite]" />
      </div>

      {/* Covercast Logo */}
      <div
        className={`relative mb-10 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="absolute inset-0 rounded-none blur-3xl bg-[rgba(201,168,124,0.15)] scale-125 pointer-events-none" />
        <div className="relative animate-float">
          <Image
            src="/covercast-logo.png"
            alt="Covercast专业封面编辑器Logo - 免费在线背景制作工具"
            width={120}
            height={120}
            className="relative rounded-none shadow-[0_12px_48px_rgba(140,109,63,0.2)]"
            priority
          />
        </div>
      </div>

      {/* Badge */}
      <div
        className={`mb-8 transition-all duration-700 delay-200 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none text-[13px] font-medium tracking-wide
                         bg-[rgba(201,168,124,0.1)] text-[#c9a87c] border border-[rgba(201,168,124,0.2)]"
        >
          <span className="w-1.5 h-1.5 bg-[#c9a87c] animate-pulse" />
          开源免费 · 无需注册
        </span>
      </div>

      {/* Title with serif literary style */}
      <h1
        className={`relative mb-6 transition-all duration-1000 delay-300 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <span className="block font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#0a0e1a] leading-[1.1]">
          Covercast
        </span>
        <span className="block mt-3 text-xl md:text-2xl lg:text-3xl font-light text-[#4a5568] tracking-[0.15em]">
          专业封面编辑器
        </span>
      </h1>

      {/* Subtitle */}
      <p
        className={`relative max-w-2xl text-base md:text-lg text-[#64748b] leading-[1.8] mb-12 transition-all duration-1000 delay-500 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        可视化拖拽编辑，实时预览，一键导出 SVG / PNG
        <br className="hidden md:block" />
        为直播创作者打造的精美背景制作工具
      </p>

      {/* CTA Buttons */}
      <div
        className={`relative flex flex-wrap items-center justify-center gap-5 transition-all duration-1000 delay-700 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <Link
          href="/editor"
          className="group relative inline-flex items-center justify-center px-9 py-4 rounded-none text-white font-bold text-base overflow-hidden
                     bg-[#8c6d3f]
                     shadow-[0_4px_24px_rgba(140,109,63,0.3)]
                     transition-all duration-300 ease-out
                     hover:bg-[#a07d4a] hover:shadow-[0_8px_36px_rgba(140,109,63,0.45)] hover:-translate-y-0.5
                     active:translate-y-0 active:shadow-[0_2px_16px_rgba(140,109,63,0.3)]"
          aria-label="开始使用Covercast编辑器创建直播背景"
        >
          <span className="relative z-10 flex items-center gap-2">
            开始使用
            <svg
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </Link>

        <a
          href="https://github.com/lulabs-org/covercast"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-none font-bold text-base
                     bg-[rgba(255,255,255,0.6)] backdrop-blur-sm text-[#1e293b] border border-[rgba(201,168,124,0.2)]
                     transition-all duration-300 ease-out
                     hover:bg-[rgba(255,255,255,0.8)] hover:border-[rgba(201,168,124,0.4)] hover:-translate-y-0.5
                     active:translate-y-0"
          aria-label="访问Covercast GitHub开源仓库"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub 仓库
        </a>
      </div>

      {/* Scroll indicator */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 delay-1000 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col items-center gap-2 text-[#94a3b8]">
          <span className="text-[11px] tracking-[0.2em] uppercase font-light">探索更多</span>
          <div className="w-5 h-8 rounded-full border border-[rgba(148,163,184,0.3)] flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-[#c9a87c] animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  )
}
