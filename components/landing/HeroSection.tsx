import Image from 'next/image'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-32"
      aria-label="Covercast封面编辑器介绍"
    >
      {/* Glow backdrop behind logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(39,100,246,0.12)_0%,transparent_70%)] pointer-events-none" />

      {/* Covercast Logo - large, centered, with glow */}
      <div className="relative mb-8 animate-float">
        <div className="absolute inset-0 rounded-3xl blur-2xl bg-[rgba(39,100,246,0.22)] scale-110 pointer-events-none" />
        <Image
          src="/covercast-logo.png"
          alt="Covercast专业封面编辑器Logo - 免费在线背景制作工具"
          width={160}
          height={160}
          className="relative rounded-2xl shadow-[0_8px_40px_rgba(39,100,246,0.18)]"
          priority
        />
      </div>

      {/* Title */}
      <h1 className="relative text-4xl md:text-5xl font-extrabold tracking-tight text-[#152033] mb-4">
        Covercast - 专业封面编辑器
      </h1>

      {/* Subtitle */}
      <p className="relative max-w-xl text-lg md:text-xl text-[#65728a] leading-relaxed mb-10">
        免费在线直播背景制作工具，支持可视化拖拽编辑、实时预览、一键导出SVG/PNG。
        快速创建精美的直播间背景图片，适用于抖音、快手、B站、YouTube等平台直播。
        无需设计经验，轻松制作专业背景。
      </p>

      {/* CTA Buttons */}
      <div className="relative flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/editor"
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-white font-bold text-base
                     bg-[#2764f6] shadow-[0_4px_20px_rgba(39,100,246,0.35)]
                     transition-all duration-200 ease-out
                     hover:bg-[#174ac6] hover:shadow-[0_6px_28px_rgba(39,100,246,0.45)] hover:-translate-y-0.5
                     active:translate-y-0 active:shadow-[0_2px_12px_rgba(39,100,246,0.3)]"
          aria-label="开始使用Covercast编辑器创建直播背景"
        >
          开始使用
        </Link>
        <a
          href="https://github.com/lulabs-org/covercast"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-[#1c2a3d] font-bold text-base
                     bg-[#eef3fb] border border-[#d4deef]
                     transition-all duration-200 ease-out
                     hover:bg-[#e4ecf8] hover:border-[#c7d5e8] hover:-translate-y-0.5
                     active:translate-y-0"
          aria-label="访问Covercast GitHub开源仓库"
        >
          GitHub 仓库
        </a>
      </div>
    </section>
  )
}
