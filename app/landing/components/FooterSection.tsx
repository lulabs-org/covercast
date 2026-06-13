'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function FooterSection() {
  return (
    <footer className="relative px-6 py-20 md:py-28 bg-[#0a0e1a] overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-[radial-gradient(circle,rgba(201,168,124,0.06)_0%,transparent_65%)]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-[radial-gradient(circle,rgba(180,140,90,0.04)_0%,transparent_65%)]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Top section with CTA */}
        <div className="text-center mb-16 pb-16 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="text-2xl md:text-4xl font-serif font-bold text-white mb-4 leading-tight">
            开始创作你的封面
          </h2>
          <p className="text-[15px] text-[#64748b] mb-8">无需注册，即刻开始</p>
          <Link
            href="/editor"
            className="group relative inline-flex items-center justify-center px-8 py-3.5 rounded-none text-white font-bold text-base overflow-hidden
                       bg-[#8c6d3f]
                       shadow-[0_4px_24px_rgba(140,109,63,0.25)]
                       transition-all duration-300 ease-out
                       hover:bg-[#a07d4a] hover:shadow-[0_8px_36px_rgba(140,109,63,0.4)] hover:-translate-y-0.5
                       active:translate-y-0"
            aria-label="开始使用Covercast编辑器"
          >
            <span className="relative z-10 flex items-center gap-2">
              进入编辑器
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
        </div>

        {/* Bottom section with links and branding */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          {/* Left: Covercast branding */}
          <div className="flex items-center gap-4">
            <Image
              src="/covercast-logo.png"
              alt="Covercast"
              width={40}
              height={40}
              className="rounded-none shadow-[0_2px_12px_rgba(140,109,63,0.2)]"
            />
            <div>
              <p className="text-[15px] font-bold text-white">Covercast</p>
              <p className="text-[12px] text-[#475569]">封面编辑器</p>
            </div>
          </div>

          {/* Center: Links */}
          <div className="flex items-center gap-8">
            <a
              href="https://github.com/lulabs-org/covercast"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-medium text-[#64748b] transition-colors duration-300 hover:text-[#c9a87c]"
            >
              GitHub
            </a>
            <a
              href="https://www.lulabs.org/zh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-medium text-[#64748b] transition-colors duration-300 hover:text-[#c9a87c]"
            >
              陆向谦实验室
            </a>
          </div>

          {/* Right: LuLabs logo */}
          <a
            href="https://www.lulabs.org/zh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
          >
            <span className="text-[13px] text-[#475569] group-hover:text-[#c9a87c] transition-colors duration-300">
              由
            </span>
            <Image
              src="/lulabs-logo.png"
              alt="陆向谦实验室"
              width={32}
              height={32}
              className="rounded-none transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-[13px] font-bold text-[#94a3b8] group-hover:text-[#c9a87c] transition-colors duration-300">
              陆向谦实验室
            </span>
            <span className="text-[13px] text-[#475569] group-hover:text-[#c9a87c] transition-colors duration-300">
              出品
            </span>
          </a>
        </div>

        {/* Copyright */}
        <div className="mt-12 text-center">
          <p className="text-[12px] text-[#334155]">
            © {new Date().getFullYear()} Covercast. Open source under MIT License.
          </p>
        </div>
      </div>
    </footer>
  )
}
