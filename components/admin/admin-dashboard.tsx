'use client'

import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Bar, BarChart,
} from 'recharts'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import {
  Clock, ArrowRight, AlertTriangle, CheckCircle2,
  TrendingUp, CircleDot, Loader, MessageSquare, RotateCcw,
} from 'lucide-react'

import { StatsCards } from '@/components/admin/stats-cards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DisplayStatus } from '@/lib/constants'
import type { EventType } from '@/lib/types/enums'

// ── Types ──

interface StatusPillData { display: DisplayStatus; count: number; trend?: number }
interface TicketItem { id: string; title: string; department: string; status: string; updated_at: string; profiles: { full_name: string } | null }
interface PendingTicket { id: string; title: string; department: string; status: string; created_at: string; profiles: { full_name: string; avatar_url: string | null } | null }
interface StalledTicket { id: string; title: string; status: string; department: string; updated_at: string; profiles: { full_name: string } | null }
interface ActivityEvent { id: string; ticket_id: string; event_type: EventType; old_value: string | null; new_value: string | null; comment: string | null; created_at: string; profiles: { full_name: string; avatar_url: string | null } | null; tickets: { id: string; title: string; status: string; department: string; description: string } | null }

interface AdminDashboardProps {
  adminName: string
  totalTickets: number
  pills: StatusPillData[]
  ticketsByStatus: Record<DisplayStatus, TicketItem[]>
  departmentData: Array<{ department: string; count: number }>
  weeklyData: Array<{ week: string; count: number }>
  pendingTickets: PendingTicket[]
  events: ActivityEvent[]
  stalledTickets: StalledTicket[]
}

const EVENT_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  created: { label: 'Submeteu uma ideia', icon: CircleDot, color: 'text-primary', bg: 'bg-primary/10' },
  status_changed: { label: 'Atualizou status', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  substatus_changed: { label: 'Atualizou etapa', icon: Loader, color: 'text-info', bg: 'bg-info/10' },
  observation_added: { label: 'Adicionou observação', icon: MessageSquare, color: 'text-secondary', bg: 'bg-secondary/10' },
  reopen_requested: { label: 'Solicitou reabertura', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  reopened: { label: 'Reabriu chamado', icon: RotateCcw, color: 'text-info', bg: 'bg-info/10' },
}

const MEDALS = ['🥇', '🥈', '🥉']

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getStatusMessage(pending: number, stalled: number): { text: string; type: 'success' | 'warning' | 'danger' } {
  if (pending === 0 && stalled === 0) return { text: 'Tudo tranquilo. Nenhum chamado pendente.', type: 'success' }
  if (stalled > 0 && pending > 0) return { text: `${pending} pendente${pending > 1 ? 's' : ''} para revisar · ${stalled} parado${stalled > 1 ? 's' : ''} há +7 dias`, type: 'danger' }
  if (pending > 0) return { text: `${pending} chamado${pending > 1 ? 's' : ''} aguardando sua revisão`, type: 'warning' }
  return { text: `${stalled} projeto${stalled > 1 ? 's' : ''} parado${stalled > 1 ? 's' : ''} há +7 dias`, type: 'warning' }
}

export function AdminDashboard({
  adminName, totalTickets, pills, ticketsByStatus, departmentData,
  weeklyData, pendingTickets, events, stalledTickets,
}: AdminDashboardProps) {
  const status = getStatusMessage(pendingTickets.length, stalledTickets.length)

  const statusColors = {
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
  }

  const statusDots = {
    success: 'bg-success',
    warning: 'bg-warning animate-pulse',
    danger: 'bg-destructive animate-pulse',
  }

  return (
    <div className="space-y-8">
      {/* ── ZONA 1: Saudação + Status ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">
              {getGreeting()}, {adminName}
            </h1>
            <span className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('h-2 w-2 rounded-full', statusDots[status.type])} />
            <p className={cn('text-sm font-medium', statusColors[status.type])}>
              {status.text}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── ZONA 2: Stats ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <StatsCards pills={pills} ticketsByStatus={ticketsByStatus} isAdmin />
      </motion.div>

      {/* ── ZONA 3: Ação + Contexto (2 colunas) ── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Coluna esquerda — AÇÃO (2/5) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Requer sua ação */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className={cn(
              'overflow-hidden',
              pendingTickets.length > 0 && 'border-warning/30'
            )}>
              {pendingTickets.length > 0 && (
                <div className="h-1 bg-gradient-to-r from-warning to-warning/50" />
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    Requer sua ação
                  </CardTitle>
                  {pendingTickets.length > 0 && (
                    <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                      <Link href="/admin/fila">Ver fila <ArrowRight className="h-3 w-3 ml-1" /></Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {pendingTickets.length === 0 ? (
                  <div className="flex items-center gap-3 py-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <p className="text-sm text-muted-foreground">Nenhum chamado pendente. Tudo em dia!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingTickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href="/admin/fila"
                        className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors group"
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={ticket.profiles?.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[9px] bg-warning/10 text-warning">
                            {ticket.profiles?.full_name?.charAt(0) ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{ticket.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {ticket.profiles?.full_name ?? '—'} · {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Chamados parados */}
          {stalledTickets.length > 0 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-destructive/20 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-destructive to-destructive/50" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Parados há +7 dias
                    <Badge variant="outline" className="ml-auto text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                      {stalledTickets.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stalledTickets.slice(0, 4).map((ticket) => {
                      const days = Math.floor((Date.now() - new Date(ticket.updated_at).getTime()) / (1000 * 60 * 60 * 24))
                      return (
                        <Link
                          key={ticket.id}
                          href={`/admin/projetos/${ticket.id}`}
                          className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                            <span className="text-xs font-bold text-destructive">{days}d</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{ticket.title}</p>
                            <p className="text-[11px] text-muted-foreground">{ticket.department}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Atividade Recente */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma atividade recente.</p>
                ) : (
                  <div className="space-y-1">
                    {events.slice(0, 8).map((event) => {
                      const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.created
                      const EventIcon = config.icon
                      return (
                        <Link
                          key={event.id}
                          href={`/admin/projetos/${event.ticket_id}`}
                          className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors group"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={event.profiles?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px] bg-muted">
                              {event.profiles?.full_name?.charAt(0) ?? '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug">
                              <span className="font-medium group-hover:text-primary transition-colors">
                                {event.profiles?.full_name ?? 'Usuário'}
                              </span>
                              {' '}
                              <span className="text-muted-foreground font-normal">{config.label.toLowerCase()}</span>
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                              {event.tickets?.title ?? 'Chamado'}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground/40 shrink-0 mt-1">
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Coluna direita — CONTEXTO (3/5) */}
        <div className="lg:col-span-3 space-y-6">

          {/* Tendência Semanal */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-info" />
                  Tendência Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} className="fill-muted-foreground" />
                    <RechartsTooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Area type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} fill="url(#colorCount)" name="Ideias" dot={{ r: 3, fill: 'var(--color-primary)' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Por Setor */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Chamados por Setor</CardTitle>
              </CardHeader>
              <CardContent>
                {departmentData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum dado disponível.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={departmentData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="department" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} className="fill-muted-foreground" />
                      <RechartsTooltip
                        contentStyle={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
                      />
                      <Bar dataKey="count" fill="var(--color-secondary)" radius={[6, 6, 0, 0]} name="Chamados" maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
