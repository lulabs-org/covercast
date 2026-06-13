interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div
      className="group relative flex flex-col items-start p-7 rounded-2xl border border-[#e4ebf6] bg-white/80 backdrop-blur-sm
                 shadow-[0_1px_3px_rgba(0,0,0,0.04)]
                 transition-all duration-300 ease-out
                 hover:shadow-[0_8px_30px_rgba(21,32,51,0.08)] hover:border-[#d4deef] hover:-translate-y-1"
    >
      {/* Subtle top highlight */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(39,100,246,0.25)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="mb-4 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#eaf1ff] text-[#2764f6] font-bold text-lg">
        {icon}
      </div>
      <h3 className="text-[17px] font-extrabold text-[#152033] mb-2">{title}</h3>
      <p className="text-[14px] leading-relaxed text-[#65728a]">{description}</p>
    </div>
  )
}
