'use client'

import FeatureCard from './FeatureCard'
import { useEffect, useRef, useState } from 'react'

const features = [
  {
    icon: '✦',
    title: '可视化编辑',
    description:
      '拖拽式画布操作，支持文本、图片、形状等多种元素，所见即所得。无需设计经验，轻松创建专业直播背景。',
    accent: 'blue' as const,
  },
  {
    icon: '◈',
    title: '实时预览',
    description:
      '编辑过程中即时渲染效果，调整参数秒级响应，无需反复导出查看。确保直播背景在各平台完美展示。',
    accent: 'violet' as const,
  },
  {
    icon: '◇',
    title: '一键导出',
    description:
      '支持 SVG、PNG 等多种格式导出，满足抖音、快手、B站、YouTube 等各平台直播背景尺寸需求。高清导出，质量保证。',
    accent: 'gold' as const,
  },
  {
    icon: '✧',
    title: '模板管理',
    description:
      '内置常用直播背景模板，支持自定义保存与快速复用，提升工作效率。一键应用模板，快速开始创作。',
    accent: 'violet' as const,
  },
  {
    icon: '◎',
    title: '多场景适配',
    description:
      '针对横屏、竖屏、方形等多种直播场景优化，一次设计多端适用。适配所有主流直播平台的尺寸要求。',
    accent: 'blue' as const,
  },
  {
    icon: '✶',
    title: '开源免费',
    description:
      '基于开源协议发布，代码透明可审计，社区驱动持续迭代优化。完全免费使用，无需注册账号。',
    accent: 'gold' as const,
  },
]

export default function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative px-6 py-24 md:py-36"
      aria-label="Covercast功能特性介绍"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div
          className={`text-center mb-20 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className="inline-block mb-4 text-[13px] tracking-[0.25em] uppercase text-[#c9a87c] font-medium">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#0a0e1a] mb-5 leading-tight">
            为创作者而生的工具集
          </h2>
          <p className="max-w-lg mx-auto text-[15px] text-[#64748b] leading-relaxed">
            每一个功能，都为直播场景精心打磨
          </p>
          {/* Decorative divider */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-12 h-px bg-[rgba(201,168,124,0.3)]" />
            <div className="w-1.5 h-1.5 bg-[#c9a87c]" />
            <div className="w-12 h-px bg-[rgba(201,168,124,0.3)]" />
          </div>
        </div>

        {/* Bento-style grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              description={f.description}
              index={i}
              accent={f.accent}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
