'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TicketCard } from './ticket-card'
import {
  Sparkles, SearchX, Search, Plus, ArrowRight,
  CircleDot, Loader, CheckCircle2, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getDisplayStatus, DISPLAY_STATUS_LABELS, DISPLAY_STATUS_DOT_COLORS, TICKET_STATUS_LABELS, type DisplayStatus } from '@/lib/constants'
import type { TicketStatus, DevSubstatus } from '@/lib/types/enums'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Ticket {
  id: string
  title: string
  department: string
  status: TicketStatus
  dev_substatus: DevSubstatus | null
  created_at: string
  updated_at: string
}

interface RecentHighlight {
  ticketId: string
  ticketTitle: string
  eventType: string
  newValue: string | null
}

interface TicketListProps {
  tickets: Ticket[]
  userName: string
  recentHighlight?: RecentHighlight
}

const FILTERS: { value: DisplayStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'aberto', label: 'Abertos' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluídos' },
  { value: 'recusado', label: 'Recusados' },
]

const STAT_CARDS: { display: DisplayStatus; icon: typeof CircleDot; iconColor: string; bgColor: string }[] = [
  { display: 'aberto', icon: CircleDot, iconColor: 'text-warning', bgColor: 'bg-warning/10 border-warning/20 hover:border-warning/40' },
  { display: 'em_andamento', icon: Loader, iconColor: 'text-info', bgColor: 'bg-info/10 border-info/20 hover:border-info/40' },
  { display: 'concluido', icon: CheckCircle2, iconColor: 'text-success', bgColor: 'bg-success/10 border-success/20 hover:border-success/40' },
]

const HIGHLIGHT_MESSAGES: Record<string, (val: string | null) => string> = {
  status_changed: (val) => {
    if (val === 'aprovado') return 'foi aprovado!'
    if (val === 'concluido') return 'foi concluído!'
    if (val === 'recusado') return 'foi recusado.'
    if (val === 'em_desenvolvimento') return 'entrou em desenvolvimento!'
    return 'teve o status atualizado.'
  },
  reopened: () => 'foi reaberto!',
  reopen_requested: () => 'teve reabertura solicitada.',
}

const HIGHLIGHT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  aprovado: { bg: 'bg-success/5', border: 'border-success/30', text: 'text-success' },
  concluido: { bg: 'bg-success/5', border: 'border-success/30', text: 'text-success' },
  recusado: { bg: 'bg-destructive/5', border: 'border-destructive/30', text: 'text-destructive' },
  em_desenvolvimento: { bg: 'bg-info/5', border: 'border-info/30', text: 'text-info' },
}

export function TicketList({ tickets, userName, recentHighlight }: TicketListProps) {
  const [filter, setFilter] = useState<DisplayStatus | 'todos'>('todos')
  const [search, setSearch] = useState('')

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: tickets.length }
    for (const t of tickets) {
      const d = getDisplayStatus(t.status)
      c[d] = (c[d] ?? 0) + 1
    }
    return c
  }, [tickets])

  const filtered = useMemo(() => {
    let list = tickets
    if (filter !== 'todos') {
      list = list.filter((t) => getDisplayStatus(t.status) === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((t) => t.title.toLowerCase().includes(q))
    }
    return list
  }, [tickets, filter, search])

  const firstName = userName.split(' ')[0]

  const highlightMsg = recentHighlight
    ? HIGHLIGHT_MESSAGES[recentHighlight.eventType]?.(recentHighlight.newValue)
    : null
  const highlightColors = recentHighlight?.newValue
    ? HIGHLIGHT_COLORS[recentHighlight.newValue] ?? { bg: 'bg-primary/5', border: 'border-primary/30', text: 'text-primary' }
    : { bg: 'bg-primary/5', border: 'border-primary/30', text: 'text-primary' }

  return (
    <div className="space-y-6">
      {/* Header com saudação e gradient */}
      <div className="relative -mx-6 lg:-mx-8 -mt-6 px-6 lg:px-8 pt-6 pb-6 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Olá, {firstName}</h1>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe suas ideias e inovações</p>
          </div>
          <Button asChild size="sm" className="gap-1.5 shrink-0">
            <Link href="/app/novo">
              <Plus className="h-4 w-4" />
              Nova Ideia
            </Link>
          </Button>
        </div>

        {/* Quick stats cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {STAT_CARDS.map((stat) => {
            const Icon = stat.icon
            const count = counts[stat.display] ?? 0
            return (
              <button
                key={stat.display}
                onClick={() => setFilter(filter === stat.display ? 'todos' : stat.display)}
                className={cn(
                  'rounded-xl border p-3 transition-all duration-200 text-left',
                  stat.bgColor,
                  filter === stat.display && 'ring-1 ring-current/20 shadow-sm'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn('h-3.5 w-3.5', stat.iconColor)} />
                  <span className="text-xs text-muted-foreground">{DISPLAY_STATUS_LABELS[stat.display]}</span>
                </div>
                <p className="text-2xl font-bold">{count}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Highlight card */}
      {recentHighlight && highlightMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link href={`/app/${recentHighlight.ticketId}`}>
            <Card className={cn(
              'border transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer',
              highlightColors.bg, highlightColors.border
            )}>
              <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{recentHighlight.ticketTitle}</span>{' '}
                    <span className={highlightColors.text}>{highlightMsg}</span>
                  </p>
                </div>
                <ArrowRight className={cn('h-4 w-4 shrink-0', highlightColors.text)} />
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}

      {/* Search + filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => {
            const count = counts[f.value] ?? 0
            const isActive = filter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'relative text-sm px-4 py-2 rounded-full border transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {f.label}
                {count > 0 && (
                  <span className={cn(
                    'ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista de cards */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          filter === 'todos' && !search ? (
            <motion.div
              key="empty-all"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl scale-150" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10">
                  <Sparkles className="h-12 w-12 text-primary animate-float-slow" />
                </div>
              </div>
              <h2 className="text-xl font-bold">Sua primeira grande ideia começa aqui</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
                Submeta uma ideia de sistema e acompanhe o progresso em tempo real.
              </p>
              <Button asChild className="mt-6 gap-2">
                <Link href="/app/novo">
                  <Sparkles className="h-4 w-4" />
                  Enviar primeira ideia
                </Link>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key={`empty-${filter}-${search}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted mb-4">
                <SearchX className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <p className="font-medium">
                {search ? 'Nenhum resultado encontrado' : `Nenhum chamado ${DISPLAY_STATUS_LABELS[filter as DisplayStatus]?.toLowerCase() ?? ''}`}
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {search ? 'Tente buscar com outras palavras.' : 'Você não tem chamados com esse status no momento.'}
              </p>
            </motion.div>
          )
        ) : (
          <motion.div
            key={filter + search}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((ticket, i) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <TicketCard ticket={ticket} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
