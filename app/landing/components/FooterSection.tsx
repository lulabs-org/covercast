"use client";

import Image from "next/image";

export default function FooterSection() {
  return (
    <footer className="relative px-6 py-16 md:py-20 border-t border-[#e4ebf6]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
        {/* Left: Covercast branding */}
        <div className="flex items-center gap-4">
          <Image
            src="/covercast-logo.png"
            alt="Covercast"
            width={48}
            height={48}
            className="rounded-xl shadow-[0_2px_12px_rgba(39,100,246,0.15)]"
          />
          <div>
            <p className="text-[15px] font-extrabold text-[#152033]">Covercast</p>
            <p className="text-[13px] text-[#65728a]">封面编辑器</p>
          </div>
        </div>

        {/* Center: Links */}
        <div className="flex items-center gap-8">
          <a
            href="https://github.com/lulabs-org/covercast"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-bold text-[#65728a] transition-colors duration-200 hover:text-[#2764f6]"
          >
            GitHub
          </a>
          <a
            href="https://www.lulabs.org/zh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-bold text-[#65728a] transition-colors duration-200 hover:text-[#2764f6]"
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
          <span className="text-[13px] text-[#65728a] group-hover:text-[#2764f6] transition-colors duration-200">
            由
          </span>
          <Image
            src="/lulabs-logo.png"
            alt="陆向谦实验室"
            width={36}
            height={36}
            className="rounded-lg shadow-[0_1px_6px_rgba(0,0,0,0.06)] transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-[13px] font-bold text-[#152033] group-hover:text-[#2764f6] transition-colors duration-200">
            陆向谦实验室
          </span>
          <span className="text-[13px] text-[#65728a] group-hover:text-[#2764f6] transition-colors duration-200">
            出品
          </span>
        </a>
      </div>

      <div className="max-w-5xl mx-auto mt-12 text-center">
        <p className="text-[12px] text-[#9aa9c0]">
          © {new Date().getFullYear()} Covercast. Open source under MIT License.
        </p>
      </div>
    </footer>
  );
}
