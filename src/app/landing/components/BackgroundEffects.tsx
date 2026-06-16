'use client'

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Very subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #dfe5ef 1px, transparent 1px), linear-gradient(to bottom, #dfe5ef 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Soft gradient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(39,100,246,0.06)_0%,transparent_65%)]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(100,150,255,0.05)_0%,transparent_65%)]" />
      <div className="absolute top-[40%] right-[15%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(39,100,246,0.04)_0%,transparent_60%)]" />
    </div>
  )
}
