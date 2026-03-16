'use client'

import { useTransition, useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  MessageSquare,
  User,
  CheckCircle2,
  XCircle,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { updateSessionStatus } from '@/actions/mentoring'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'

interface Session {
  id: string
  scheduled_date: string
  scheduled_start: string
  scheduled_end: string
  topic: string
  notes: string | null
  status: string
  created_at: string
  profiles?: {
    full_name: string
    email: string
    avatar_url: string | null
    department: string | null
  } | null
  admin_profiles?: { full_name: string } | null
}

interface SessionsListProps {
  sessions: Session[]
  isAdmin?: boolean
}

type FilterTab = 'todas' | 'agendada' | 'concluida' | 'cancelada'

const TABS: { value: FilterTab; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'agendada', label: 'Agendadas' },
  { value: 'concluida', label: 'Concluídas' },
  { value: 'cancelada', label: 'Canceladas' },
]

const STATUS_CONFIG: Record<
  string,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    className: string
    borderClass: string
  }
> = {
  agendada: {
    label: 'Agendada',
    variant: 'outline',
    className: 'bg-info/10 text-info border-info/20',
    borderClass: 'border-l-info',
  },
  concluida: {
    label: 'Concluída',
    variant: 'outline',
    className: 'bg-success/10 text-success border-success/20',
    borderClass: 'border-l-success',
  },
  cancelada: {
    label: 'Cancelada',
    variant: 'outline',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    borderClass: 'border-l-muted',
  },
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

function formatDateLabel(dateStr: string) {
  const date = parseISO(dateStr)
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function SessionsList({ sessions, isAdmin = false }: SessionsListProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('todas')
  const [isPending, startTransition] = useTransition()
  const [actioningId, setActioningId] = useState<string | null>(null)

  const filteredSessions = useMemo(() => {
    if (activeTab === 'todas') return sessions
    return sessions.filter((s) => s.status === activeTab)
  }, [sessions, activeTab])

  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: sessions.length }
    for (const s of sessions) {
      c[s.status] = (c[s.status] || 0) + 1
    }
    return c
  }, [sessions])

  function handleStatusChange(
    sessionId: string,
    status: 'concluida' | 'cancelada'
  ) {
    setActioningId(sessionId)
    startTransition(async () => {
      const result = await updateSessionStatus(sessionId, status)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(
          status === 'concluida' ? 'Sessão concluída' : 'Sessão cancelada'
        )
      }
      setActioningId(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-lg bg-muted/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              activeTab === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {(counts[tab.value] ?? 0) > 0 && (
              <span
                className={cn(
                  'ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-xs tabular-nums',
                  activeTab === tab.value
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {counts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {filteredSessions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Calendar />
            </EmptyMedia>
            <EmptyTitle>Nenhuma sessão encontrada</EmptyTitle>
            <EmptyDescription>
              {activeTab === 'todas'
                ? 'Nenhuma sessão de mentoria foi agendada ainda.'
                : `Nenhuma sessão com status "${TABS.find((t) => t.value === activeTab)?.label}".`}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filteredSessions.map((session, idx) => {
              const config = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.agendada
              const person = isAdmin ? session.profiles : session.admin_profiles
              const isActioning = actioningId === session.id

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  layout
                >
                  <Card
                    className={cn(
                      'border-l-[3px] transition-colors',
                      config.borderClass,
                      session.status === 'cancelada' && 'opacity-70'
                    )}
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        {/* Left: info */}
                        <div className="flex-1 space-y-3">
                          {/* Date + time + status */}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              <Calendar className="size-3.5 text-muted-foreground" />
                              <span className="capitalize">
                                {formatDateLabel(session.scheduled_date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                              <Clock className="size-3.5" />
                              {formatTime(session.scheduled_start)} -{' '}
                              {formatTime(session.scheduled_end)}
                            </div>
                            <Badge
                              variant={config.variant}
                              className={config.className}
                            >
                              {config.label}
                            </Badge>
                          </div>

                          {/* Topic */}
                          <div className="flex items-start gap-2">
                            <MessageSquare className="mt-0.5 size-4 text-info shrink-0" />
                            <p className="text-sm font-medium leading-snug">
                              {session.topic}
                            </p>
                          </div>

                          {/* Person info */}
                          {person && (
                            <div className="flex items-center gap-2.5">
                              {isAdmin && session.profiles ? (
                                <>
                                  <Avatar className="h-7 w-7">
                                    {session.profiles.avatar_url && (
                                      <AvatarImage
                                        src={session.profiles.avatar_url}
                                        alt={session.profiles.full_name}
                                      />
                                    )}
                                    <AvatarFallback className="text-[10px]">
                                      {getInitials(session.profiles.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium leading-tight">
                                      {session.profiles.full_name}
                                    </span>
                                    {session.profiles.department && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Building2 className="size-3" />
                                        {session.profiles.department}
                                      </span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                !isAdmin &&
                                session.admin_profiles && (
                                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <User className="size-3.5" />
                                    {session.admin_profiles.full_name}
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          {/* Notes */}
                          {session.notes && (
                            <p className="text-xs text-muted-foreground leading-relaxed pl-6 border-l-2 border-muted">
                              {session.notes}
                            </p>
                          )}
                        </div>

                        {/* Right: actions */}
                        {isAdmin && session.status === 'agendada' && (
                          <div className="flex shrink-0 gap-2 sm:flex-col">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 border-success/30 text-success hover:bg-success/10 hover:text-success"
                              disabled={isActioning}
                              onClick={() =>
                                handleStatusChange(session.id, 'concluida')
                              }
                            >
                              {isActioning ? (
                                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <CheckCircle2 className="size-3.5" />
                              )}
                              Concluir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={isActioning}
                              onClick={() =>
                                handleStatusChange(session.id, 'cancelada')
                              }
                            >
                              <XCircle className="size-3.5" />
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
