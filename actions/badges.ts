'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface Badge {
  type: string
  label: string
  description: string
  icon: string
  earned: boolean
}

const BADGE_DEFINITIONS: Array<{
  type: string
  label: string
  description: string
  icon: string
  check: (data: { ticketCount: number; approvedCount: number; completedCount: number; mentoringCount: number }) => boolean
}> = [
  {
    type: 'primeira_ideia',
    label: 'Primeira Ideia',
    description: 'Submeteu a primeira ideia',
    icon: 'Lightbulb',
    check: (d) => d.ticketCount >= 1,
  },
  {
    type: 'cinco_ideias',
    label: '5 Ideias',
    description: 'Submeteu 5 ideias',
    icon: 'Flame',
    check: (d) => d.ticketCount >= 5,
  },
  {
    type: 'ideia_aprovada',
    label: 'Aprovado!',
    description: 'Teve uma ideia aprovada',
    icon: 'ThumbsUp',
    check: (d) => d.approvedCount >= 1,
  },
  {
    type: 'tres_aprovadas',
    label: 'Inovador',
    description: '3 ideias aprovadas',
    icon: 'Award',
    check: (d) => d.approvedCount >= 3,
  },
  {
    type: 'ideia_concluida',
    label: 'Realizado!',
    description: 'Uma ideia virou realidade',
    icon: 'Rocket',
    check: (d) => d.completedCount >= 1,
  },
  {
    type: 'participou_mentoria',
    label: 'Aprendiz',
    description: 'Participou de uma mentoria',
    icon: 'GraduationCap',
    check: (d) => d.mentoringCount >= 1,
  },
]

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const admin = createAdminClient()

  const [
    { count: ticketCount },
    { count: approvedCount },
    { count: completedCount },
    { count: mentoringCount },
  ] = await Promise.all([
    admin.from('tickets').select('*', { count: 'exact', head: true }).eq('author_id', userId),
    admin.from('tickets').select('*', { count: 'exact', head: true }).eq('author_id', userId).in('status', ['aprovado', 'em_desenvolvimento', 'concluido']),
    admin.from('tickets').select('*', { count: 'exact', head: true }).eq('author_id', userId).eq('status', 'concluido'),
    admin.from('mentoring_sessions').select('*', { count: 'exact', head: true }).eq('collaborator_id', userId).eq('status', 'concluida'),
  ])

  const data = {
    ticketCount: ticketCount ?? 0,
    approvedCount: approvedCount ?? 0,
    completedCount: completedCount ?? 0,
    mentoringCount: mentoringCount ?? 0,
  }

  return BADGE_DEFINITIONS.map((def) => ({
    type: def.type,
    label: def.label,
    description: def.description,
    icon: def.icon,
    earned: def.check(data),
  }))
}
