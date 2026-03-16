'use client'

import { useEffect, useState } from 'react'
import { getUserBadges, type Badge } from '@/actions/badges'
import {
  Lightbulb, Flame, ThumbsUp, Award, Rocket, GraduationCap, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const ICON_MAP: Record<string, React.ElementType> = {
  Lightbulb,
  Flame,
  ThumbsUp,
  Award,
  Rocket,
  GraduationCap,
}

const BADGE_COLORS: Record<string, { bg: string; icon: string; border: string }> = {
  primeira_ideia: { bg: 'bg-primary/15', icon: 'text-primary', border: 'border-primary/30' },
  cinco_ideias: { bg: 'bg-warning/15', icon: 'text-warning', border: 'border-warning/30' },
  ideia_aprovada: { bg: 'bg-success/15', icon: 'text-success', border: 'border-success/30' },
  tres_aprovadas: { bg: 'bg-info/15', icon: 'text-info', border: 'border-info/30' },
  ideia_concluida: { bg: 'bg-secondary/15', icon: 'text-secondary', border: 'border-secondary/30' },
  participou_mentoria: { bg: 'bg-info/15', icon: 'text-info', border: 'border-info/30' },
}

export function BadgeGrid({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserBadges(userId).then((data) => {
      setBadges(data)
      setLoading(false)
    })
  }, [userId])

  const earnedCount = badges.filter((b) => b.earned).length

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Conquistas</h3>
        <span className="text-xs text-muted-foreground">{earnedCount}/{badges.length}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {badges.map((badge, i) => {
          const Icon = ICON_MAP[badge.icon] ?? Lightbulb
          const colors = BADGE_COLORS[badge.type] ?? { bg: 'bg-muted', icon: 'text-muted-foreground', border: 'border-border' }

          return (
            <motion.div
              key={badge.type}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all',
                badge.earned
                  ? cn(colors.bg, colors.border)
                  : 'bg-muted/10 border-border/50 opacity-40'
              )}
              title={badge.description}
            >
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                badge.earned ? colors.bg : 'bg-muted/30'
              )}>
                {badge.earned ? (
                  <Icon className={cn('h-4 w-4', colors.icon)} />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-tight',
                badge.earned ? 'text-foreground' : 'text-muted-foreground/50'
              )}>
                {badge.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
