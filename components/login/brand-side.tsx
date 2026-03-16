'use client'

import { Lightbulb } from 'lucide-react'

const particles = [
  { size: 6, left: '12%', delay: '0s', duration: '14s', opacity: 0.3 },
  { size: 4, left: '28%', delay: '2s', duration: '11s', opacity: 0.2 },
  { size: 8, left: '45%', delay: '4s', duration: '16s', opacity: 0.25 },
  { size: 5, left: '62%', delay: '1s', duration: '13s', opacity: 0.2 },
  { size: 7, left: '78%', delay: '3s', duration: '12s', opacity: 0.3 },
  { size: 3, left: '90%', delay: '5s', duration: '15s', opacity: 0.15 },
  { size: 5, left: '20%', delay: '6s', duration: '10s', opacity: 0.2 },
  { size: 4, left: '55%', delay: '7s', duration: '18s', opacity: 0.25 },
]

export function BrandSide() {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden select-none">
      {/* Fundo com gradiente animado */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background: 'linear-gradient(135deg, oklch(0.62 0.22 32), oklch(0.72 0.21 38), oklch(0.58 0.20 28), oklch(0.68 0.21 35))',
          backgroundSize: '300% 300%',
        }}
      />

      {/* Overlay escuro sutil para profundidade */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20" />

      {/* Partículas flutuantes */}
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

      {/* Círculo grande decorativo — top right */}
      <div
        className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full border border-white/10 animate-spin-slow pointer-events-none"
        style={{ animationDuration: '30s' }}
      />
      <div
        className="absolute -top-20 -right-20 w-[280px] h-[280px] rounded-full border border-white/10 animate-spin-slow pointer-events-none"
        style={{ animationDuration: '20s', animationDirection: 'reverse' }}
      />

      {/* Orb flutuante 1 */}
      <div
        className="absolute top-1/4 -right-16 w-48 h-48 rounded-full bg-white/5 blur-xl animate-float-slow pointer-events-none"
        style={{ animationDelay: '1s' }}
      />
      {/* Orb flutuante 2 */}
      <div
        className="absolute bottom-1/3 -left-10 w-36 h-36 rounded-full bg-white/5 blur-xl animate-float-medium pointer-events-none"
        style={{ animationDelay: '3s' }}
      />

      {/* Conteúdo */}
      <div className="relative flex items-center gap-2.5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/20">
          <Lightbulb className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-wide">Efizi</span>
      </div>

      <div className="relative space-y-6">
        {/* Ícone central com anéis pulsantes */}
        <div
          className="animate-fade-up"
          style={{ animationDelay: '0.2s', opacity: 0 }}
        >
          <div className="relative inline-flex items-center justify-center mb-8">
            {/* Anéis pulsantes */}
            <div className="absolute w-20 h-20 rounded-full border-2 border-white/30 animate-pulse-ring" />
            <div
              className="absolute w-20 h-20 rounded-full border-2 border-white/20 animate-pulse-ring"
              style={{ animationDelay: '0.8s' }}
            />
            <div
              className="absolute w-20 h-20 rounded-full border border-white/10 animate-pulse-ring"
              style={{ animationDelay: '1.6s' }}
            />
            {/* Ícone central */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl animate-float-fast">
              <Lightbulb className="h-9 w-9 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>

        <div
          className="animate-fade-up"
          style={{ animationDelay: '0.35s', opacity: 0 }}
        >
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Painel de<br />Inovação
          </h1>
          <p className="text-white/75 text-base leading-relaxed max-w-xs">
            Transforme suas ideias em realidade. Submeta propostas, acompanhe o
            status e veja sua ideia ganhar vida.
          </p>
        </div>

        {/* Stats rápidos */}
        <div
          className="animate-fade-up flex gap-6 mt-2"
          style={{ animationDelay: '0.5s', opacity: 0 }}
        >
          {[
            { label: 'Ideias enviadas', value: '∞' },
            { label: 'Times', value: '10+' },
            { label: 'Em produção', value: '🚀' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/60 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <p
        className="relative text-white/50 text-xs animate-fade-up"
        style={{ animationDelay: '0.6s', opacity: 0 }}
      >
        © {new Date().getFullYear()} Efizi. Todos os direitos reservados.
      </p>
    </div>
  )
}
