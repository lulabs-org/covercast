'use client'

import FeatureCard from './FeatureCard'

const features = [
  {
    icon: '✦',
    title: '可视化编辑',
    description:
      '拖拽式画布操作，支持文本、图片、形状等多种元素，所见即所得。无需设计经验，轻松创建专业直播背景。',
  },
  {
    icon: '◈',
    title: '实时预览',
    description:
      '编辑过程中即时渲染效果，调整参数秒级响应，无需反复导出查看。确保直播背景在各平台完美展示。',
  },
  {
    icon: '◇',
    title: '一键导出',
    description:
      '支持SVG、PNG等多种格式导出，满足抖音、快手、B站、YouTube等各平台直播背景尺寸需求。高清导出，质量保证。',
  },
  {
    icon: '✧',
    title: '模板管理',
    description:
      '内置常用直播背景模板，支持自定义保存与快速复用，提升工作效率。一键应用模板，快速开始创作。',
  },
  {
    icon: '◎',
    title: '多场景适配',
    description:
      '针对横屏、竖屏、方形等多种直播场景优化，一次设计多端适用。适配所有主流直播平台的尺寸要求。',
  },
  {
    icon: '✶',
    title: '开源免费',
    description:
      '基于开源协议发布，代码透明可审计，社区驱动持续迭代优化。完全免费使用，无需注册账号。',
  },
]

export default function FeaturesSection() {
  return (
    <section className="relative px-6 py-20 md:py-28" aria-label="Covercast功能特性介绍">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#152033] mb-3">
            Covercast功能特性 - 专业直播背景制作工具
          </h2>
          <p className="text-[15px] text-[#65728a]">
            为直播创作者打造的专业工具集，支持抖音、快手、B站、YouTube等平台
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </div>
      </div>
    </section>
  )
}
