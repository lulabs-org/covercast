'use client'

import { useEffect, useRef } from 'react'

export default function BackgroundEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Floating particles
    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      opacity: number
    }[] = []
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      })
    }

    const animate = () => {
      time += 0.003
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Animated gradient orbs
      const orbs = [
        {
          x: canvas.width * 0.2 + Math.sin(time * 0.7) * 80,
          y: canvas.height * 0.3 + Math.cos(time * 0.5) * 60,
          r: 350,
          color: 'rgba(201, 168, 124, 0.08)',
        },
        {
          x: canvas.width * 0.8 + Math.cos(time * 0.6) * 100,
          y: canvas.height * 0.6 + Math.sin(time * 0.8) * 70,
          r: 400,
          color: 'rgba(180, 140, 90, 0.06)',
        },
        {
          x: canvas.width * 0.5 + Math.sin(time * 0.4) * 120,
          y: canvas.height * 0.15 + Math.cos(time * 0.3) * 50,
          r: 280,
          color: 'rgba(201, 168, 124, 0.05)',
        },
      ]

      for (const orb of orbs) {
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r)
        gradient.addColorStop(0, orb.color)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Particles
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(201, 168, 124, ${p.opacity})`
        ctx.fill()
      }

      // Draw subtle connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(201, 168, 124, ${0.04 * (1 - dist / 150)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <>
      {/* Canvas for animated particles and gradient orbs */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 pointer-events-none"
        aria-hidden="true"
      />
      {/* Subtle noise texture overlay */}
      <div
        className="fixed inset-0 -z-[9] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />
    </>
  )
}
