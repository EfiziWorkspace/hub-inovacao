'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TicketCard } from './ticket-card'
import {
  Sparkles, SearchX, Search, Plus, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getDisplayStatus, DISPLAY_STATUS_LABELS, DISPLAY_STATUS_DOT_COLORS, type DisplayStatus } from '@/lib/constants'
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
  aprovado: { bg: 'bg-success/5', border: 'border-success/20', text: 'text-success' },
  concluido: { bg: 'bg-success/5', border: 'border-success/20', text: 'text-success' },
  recusado: { bg: 'bg-destructive/5', border: 'border-destructive/20', text: 'text-destructive' },
  em_desenvolvimento: { bg: 'bg-info/5', border: 'border-info/20', text: 'text-info' },
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
    ? HIGHLIGHT_COLORS[recentHighlight.newValue] ?? { bg: 'bg-primary/5', border: 'border-primary/20', text: 'text-primary' }
    : { bg: 'bg-primary/5', border: 'border-primary/20', text: 'text-primary' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Olá, {firstName}</h1>
          <div className="flex items-center gap-4 mt-2">
            {(['aberto', 'em_andamento', 'concluido'] as DisplayStatus[]).map((d) => (
              <div key={d} className="flex items-center gap-1.5">
                <div className={cn('h-2 w-2 rounded-full', DISPLAY_STATUS_DOT_COLORS[d])} />
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{counts[d] ?? 0}</span>{' '}
                  {DISPLAY_STATUS_LABELS[d].toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/app/novo">
            <Plus className="h-4 w-4" />
            Nova Ideia
          </Link>
        </Button>
      </div>

      {/* Highlight */}
      {recentHighlight && highlightMsg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Link href={`/app/${recentHighlight.ticketId}`}>
            <div className={cn(
              'flex items-center justify-between gap-3 rounded-xl border p-3 transition-all hover:shadow-sm cursor-pointer',
              highlightColors.bg, highlightColors.border
            )}>
              <p className="text-sm">
                <span className="font-semibold">{recentHighlight.ticketTitle}</span>{' '}
                <span className={highlightColors.text}>{highlightMsg}</span>
              </p>
              <ArrowRight className={cn('h-4 w-4 shrink-0', highlightColors.text)} />
            </div>
          </Link>
        </motion.div>
      )}

      {/* Search + Filters */}
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

        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => {
            const count = counts[f.value] ?? 0
            const isActive = filter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg border transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {f.label}
                {count > 0 && (
                  <span className={cn(
                    'ml-1.5 tabular-nums',
                    isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/50'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          filter === 'todos' && !search ? (
            <motion.div
              key="empty-all"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl scale-150" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/10">
                  <Sparkles className="h-8 w-8 text-primary animate-float-slow" />
                </div>
              </div>
              <h2 className="text-lg font-bold">Sua primeira grande ideia começa aqui</h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
                Submeta uma ideia de sistema e acompanhe o progresso em tempo real.
              </p>
              <Button asChild className="mt-5 gap-2" size="sm">
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
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <SearchX className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-sm">
                {search ? 'Nenhum resultado encontrado' : `Nenhum chamado ${DISPLAY_STATUS_LABELS[filter as DisplayStatus]?.toLowerCase() ?? ''}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? 'Tente buscar com outras palavras.' : 'Você não tem chamados com esse status.'}
              </p>
            </motion.div>
          )
        ) : (
          <motion.div
            key={filter + search}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((ticket, i) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
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
