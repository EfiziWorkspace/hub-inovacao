'use client'

import { EfiziLogo } from '@/components/brand/efizi-logo'
import { Sparkles } from 'lucide-react'

const particles = [
  { size: 5, left: '10%', delay: '0s', duration: '16s', opacity: 0.2 },
  { size: 3, left: '25%', delay: '2s', duration: '12s', opacity: 0.15 },
  { size: 7, left: '40%', delay: '4s', duration: '18s', opacity: 0.2 },
  { size: 4, left: '58%', delay: '1s', duration: '14s', opacity: 0.15 },
  { size: 6, left: '72%', delay: '3s', duration: '13s', opacity: 0.25 },
  { size: 3, left: '88%', delay: '5s', duration: '17s', opacity: 0.12 },
  { size: 5, left: '15%', delay: '7s', duration: '11s', opacity: 0.18 },
  { size: 4, left: '50%', delay: '6s', duration: '19s', opacity: 0.2 },
  { size: 6, left: '35%', delay: '8s', duration: '15s', opacity: 0.15 },
  { size: 3, left: '80%', delay: '9s', duration: '13s', opacity: 0.12 },
]

export function BrandSide() {
  return (
    <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 text-white relative overflow-hidden select-none">
      {/* Animated gradient background — richer, more movement */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background: `linear-gradient(
            135deg,
            oklch(0.55 0.24 28) 0%,
            oklch(0.65 0.22 33) 25%,
            oklch(0.70 0.21 38) 50%,
            oklch(0.60 0.23 30) 75%,
            oklch(0.55 0.24 28) 100%
          )`,
          backgroundSize: '400% 400%',
        }}
      />

      {/* Secondary layer — moving mesh gradient */}
      <div
        className="absolute inset-0 animate-gradient-shift opacity-50"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 20% 80%, oklch(0.72 0.18 42 / 0.6) 0%, transparent 60%),
                       radial-gradient(ellipse 60% 40% at 80% 20%, oklch(0.58 0.25 25 / 0.4) 0%, transparent 50%)`,
          backgroundSize: '200% 200%',
          animationDuration: '8s',
          animationDirection: 'reverse',
        }}
      />

      {/* Depth overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/15 via-transparent to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-drift"
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              bottom: '-20px',
              opacity: p.opacity,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Decorative circles — orbital feel */}
      <div
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full border border-white/[0.06] animate-spin-slow pointer-events-none"
        style={{ animationDuration: '40s' }}
      />
      <div
        className="absolute -top-24 -right-24 w-[340px] h-[340px] rounded-full border border-white/[0.08] animate-spin-slow pointer-events-none"
        style={{ animationDuration: '25s', animationDirection: 'reverse' }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-[280px] h-[280px] rounded-full border border-white/[0.05] animate-spin-slow pointer-events-none"
        style={{ animationDuration: '35s' }}
      />

      {/* Floating orbs */}
      <div className="absolute top-1/4 -right-20 w-56 h-56 rounded-full bg-white/[0.04] blur-2xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -left-12 w-40 h-40 rounded-full bg-white/[0.05] blur-2xl animate-float-medium pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white/[0.03] blur-3xl animate-float-fast pointer-events-none" style={{ animationDelay: '4s' }} />

      {/* Content */}

      {/* Top — Logo */}
      <div className="relative animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <EfiziLogo className="h-8 w-auto" color="white" />
      </div>

      {/* Center — Hero */}
      <div className="relative space-y-8">
        {/* Icon with pulse rings */}
        <div className="animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute w-24 h-24 rounded-full border-2 border-white/20 animate-pulse-ring" />
            <div className="absolute w-24 h-24 rounded-full border border-white/15 animate-pulse-ring" style={{ animationDelay: '0.8s' }} />
            <div className="absolute w-24 h-24 rounded-full border border-white/10 animate-pulse-ring" style={{ animationDelay: '1.6s' }} />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 shadow-2xl animate-float-fast">
              <Sparkles className="h-10 w-10 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight">
            Hub de<br />
            <span className="text-white/90">Inovação</span>
          </h1>
          <p className="text-white/65 text-base leading-relaxed max-w-sm mt-5">
            Onde as ideias dos times Efizi ganham vida. Submeta propostas,
            acompanhe o progresso e transforme inovação em resultado.
          </p>
        </div>

        {/* Social proof */}
        <div className="animate-fade-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] max-w-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Plataforma ativa</p>
              <p className="text-xs text-white/50 mt-0.5">Ideias em tempo real dos times Efizi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom — Footer */}
      <p
        className="relative text-white/40 text-xs animate-fade-up"
        style={{ animationDelay: '0.6s', opacity: 0 }}
      >
        © {new Date().getFullYear()} Efizi. Todos os direitos reservados.
      </p>
    </div>
  )
}
