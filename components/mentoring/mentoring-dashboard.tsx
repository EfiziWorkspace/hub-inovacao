'use client'

import { useTransition, useState, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, Plus, Trash2, CalendarCheck, Sunrise, Sun, Coffee,
  Repeat, CheckCircle2, XCircle, MessageSquare, User, Building2,
  GraduationCap, CalendarDays, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  createAvailabilitySlots, deleteAvailabilitySlot, updateSessionStatus,
} from '@/actions/mentoring'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { addDays, addWeeks, startOfWeek, isBefore } from 'date-fns'

interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
  is_booked: boolean
}

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
}

const TIME_OPTIONS = Array.from({ length: 11 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`)

const PRESETS = [
  { label: 'Manhã', icon: Sunrise, times: ['08:00', '09:00', '10:00', '11:00'] },
  { label: 'Tarde', icon: Sun, times: ['13:00', '14:00', '15:00', '16:00', '17:00'] },
  { label: 'Dia inteiro', icon: Coffee, times: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
]

const WEEKDAYS = [
  { label: 'Seg', index: 1 },
  { label: 'Ter', index: 2 },
  { label: 'Qua', index: 3 },
  { label: 'Qui', index: 4 },
  { label: 'Sex', index: 5 },
]

function fmt(t: string) { return t.slice(0, 5) }
function fmtDate(d: string) { return format(parseISO(d), "EEEE, d 'de' MMMM", { locale: ptBR }) }
function fmtDateShort(d: string) { return format(parseISO(d), "EEE dd/MM", { locale: ptBR }) }
function initials(n: string) { return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() }

interface Props {
  slots: Slot[]
  sessions: Session[]
}

type Tab = 'overview' | 'horarios' | 'sessoes'

export function MentoringDashboard({ slots, sessions }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [isPending, startTransition] = useTransition()

  // Stats
  const totalSlots = slots.length
  const bookedSlots = slots.filter(s => s.is_booked).length
  const freeSlots = totalSlots - bookedSlots
  const agendadas = sessions.filter(s => s.status === 'agendada').length
  const concluidas = sessions.filter(s => s.status === 'concluida').length

  const TABS: { value: Tab; label: string; icon: typeof GraduationCap }[] = [
    { value: 'overview', label: 'Visão Geral', icon: GraduationCap },
    { value: 'horarios', label: 'Horários', icon: CalendarDays },
    { value: 'sessoes', label: 'Sessões', icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1.5 rounded-lg bg-muted/50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all',
              tab === t.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.value === 'sessoes' && agendadas > 0 && (
              <span className="bg-info/15 text-info text-xs font-semibold rounded-full px-1.5 py-0.5 tabular-nums">
                {agendadas}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <OverviewTab
            key="overview"
            totalSlots={totalSlots}
            freeSlots={freeSlots}
            agendadas={agendadas}
            concluidas={concluidas}
            upcomingSessions={sessions.filter(s => s.status === 'agendada').slice(0, 5)}
            onViewSession={() => setTab('sessoes')}
          />
        )}
        {tab === 'horarios' && (
          <HorariosTab key="horarios" slots={slots} />
        )}
        {tab === 'sessoes' && (
          <SessoesTab key="sessoes" sessions={sessions} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============= OVERVIEW TAB =============
function OverviewTab({
  totalSlots, freeSlots, agendadas, concluidas, upcomingSessions, onViewSession,
}: {
  totalSlots: number; freeSlots: number; agendadas: number; concluidas: number
  upcomingSessions: Session[]; onViewSession: () => void
}) {
  const stats = [
    { label: 'Horários criados', value: totalSlots, icon: CalendarDays, color: 'text-info', bg: 'bg-info/10' },
    { label: 'Disponíveis', value: freeSlots, icon: Calendar, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Agendadas', value: agendadas, icon: Users, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Concluídas', value: concluidas, icon: CheckCircle2, color: 'text-secondary', bg: 'bg-secondary/10' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', s.bg)}>
                    <s.icon className={cn('h-4 w-4', s.color)} />
                  </div>
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-3xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Upcoming sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-info" />
              Próximas sessões
            </CardTitle>
            {upcomingSessions.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onViewSession} className="text-xs">
                Ver todas →
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma sessão agendada.</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-info/10 text-info">
                    <span className="text-xs font-bold leading-none">
                      {format(parseISO(session.scheduled_date), 'dd')}
                    </span>
                    <span className="text-[10px] uppercase">
                      {format(parseISO(session.scheduled_date), 'MMM', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.topic}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{fmt(session.scheduled_start)} - {fmt(session.scheduled_end)}</span>
                      {session.profiles && (
                        <>
                          <span>·</span>
                          <span>{session.profiles.full_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {session.profiles?.department && (
                    <Badge variant="outline" className="text-[10px] shrink-0">{session.profiles.department}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============= HORARIOS TAB =============
function HorariosTab({ slots }: { slots: Slot[] }) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [repeatWeeks, setRepeatWeeks] = useState(1)
  const [skipLunch, setSkipLunch] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const groupedSlots = useMemo(() => {
    const groups: Record<string, Slot[]> = {}
    for (const s of slots) { (groups[s.date] ??= []).push(s) }
    return groups
  }, [slots])

  const existingTimes = useMemo(() => {
    if (!selectedDate) return new Set<string>()
    return new Set((groupedSlots[selectedDate] ?? []).map(s => fmt(s.start_time)))
  }, [selectedDate, groupedSlots])

  function getBulkDates(): string[] {
    const today = new Date()
    const dates: string[] = []
    for (let w = 0; w < repeatWeeks; w++) {
      const ws = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), w)
      for (const d of selectedDays) {
        const date = addDays(ws, d - 1)
        if (!isBefore(date, today)) dates.push(format(date, 'yyyy-MM-dd'))
      }
    }
    return [...new Set(dates)].sort()
  }

  async function handleAdd() {
    if (selectedTimes.length === 0) return toast.error('Selecione horários.')
    const dates = mode === 'single' ? (selectedDate ? [selectedDate] : []) : getBulkDates()
    if (dates.length === 0) return toast.error('Selecione data(s).')

    startTransition(async () => {
      let ok = 0, fail = 0
      for (const date of dates) {
        const fd = new FormData()
        fd.set('date', date)
        fd.set('slots', JSON.stringify(selectedTimes))
        const r = await createAvailabilitySlots(fd)
        r?.error ? fail++ : ok++
      }
      if (ok) toast.success(`${ok * selectedTimes.length} horário(s) criados`)
      if (fail) toast.warning(`${fail} dia(s) com conflito`)
      setSelectedTimes([]); setSelectedDate(''); setSelectedDays([])
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      const r = await deleteAvailabilitySlot(id)
      r?.error ? toast.error(r.error) : toast.success('Removido')
      setDeletingId(null)
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      {/* Creator */}
      <Card className="border-l-[3px] border-l-info">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-info" />
              Adicionar horários
            </span>
            <div className="flex gap-1 rounded-full border p-0.5">
              {(['single', 'bulk'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} className={cn(
                  'text-xs px-3 py-1 rounded-full transition-colors',
                  mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                )}>
                  {m === 'single' ? 'Data única' : 'Em massa'}
                </button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'single' ? (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />Data</Label>
              <Input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedTimes([]) }} min={new Date().toISOString().split('T')[0]} className="max-w-xs" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />Dias da semana</Label>
                <div className="flex gap-2">
                  {WEEKDAYS.map(d => (
                    <button key={d.index} onClick={() => setSelectedDays(p => p.includes(d.index) ? p.filter(x => x !== d.index) : [...p, d.index])} className={cn(
                      'h-10 w-12 rounded-lg border text-sm font-medium transition-all',
                      selectedDays.includes(d.index) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                    )}>{d.label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground"><Repeat className="h-3.5 w-3.5" />Repetir por</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(w => (
                    <button key={w} onClick={() => setRepeatWeeks(w)} className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm transition-all',
                      repeatWeeks === w ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                    )}>{w} sem.</button>
                  ))}
                </div>
              </div>
              {selectedDays.length > 0 && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1.5">Datas:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {getBulkDates().map(d => <Badge key={d} variant="outline" className="text-[10px] capitalize">{fmtDateShort(d)}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {(mode === 'single' ? !!selectedDate : selectedDays.length > 0) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5" />Horários</Label>
                <div className="flex gap-1.5 ml-auto">
                  {PRESETS.map(p => (
                    <button key={p.label} onClick={() => setSelectedTimes(skipLunch ? p.times.filter(t => t !== '12:00') : p.times)}
                      className="text-[11px] px-2.5 py-1 rounded-md border text-muted-foreground hover:border-info/50 hover:text-info transition-colors flex items-center gap-1">
                      <p.icon className="h-3 w-3" />{p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="sl" checked={skipLunch} onCheckedChange={v => setSkipLunch(v === true)} />
                <label htmlFor="sl" className="text-xs text-muted-foreground cursor-pointer">Pular almoço (12:00)</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map(t => {
                  const sel = selectedTimes.includes(t)
                  const ex = mode === 'single' && existingTimes.has(t)
                  const lunch = t === '12:00' && skipLunch
                  return (
                    <Button key={t} variant={sel ? 'default' : 'outline'} size="sm" disabled={ex || lunch}
                      onClick={() => setSelectedTimes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])}
                      className={cn('min-w-[72px] tabular-nums', sel && 'ring-2 ring-primary/30', (ex || lunch) && 'line-through opacity-30')}>
                      {t}
                    </Button>
                  )
                })}
              </div>
              {selectedTimes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedTimes.length} horário(s)
                  {mode === 'bulk' && ` × ${getBulkDates().length} dia(s) = ${selectedTimes.length * getBulkDates().length} slots`}
                </p>
              )}
            </motion.div>
          )}

          <Button onClick={handleAdd} disabled={isPending || selectedTimes.length === 0} className="gap-2">
            {isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Plus className="h-4 w-4" />}
            {mode === 'bulk' ? `Criar ${selectedTimes.length * getBulkDates().length} horários` : 'Adicionar'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing slots */}
      {Object.keys(groupedSlots).length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium">Nenhum horário</p>
          <p className="text-sm text-muted-foreground mt-1">Adicione horários acima.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cadastrados</h3>
          {Object.entries(groupedSlots).map(([date, dateSlots]) => (
            <Card key={date}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm capitalize">
                  <span className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-info" />
                    {fmtDate(date)}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{dateSlots.length} slot(s)</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dateSlots.map(s => (
                    <div key={s.id} className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm', s.is_booked ? 'bg-success/5 border-success/20' : 'hover:bg-muted/50')}>
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="tabular-nums font-medium">{fmt(s.start_time)} - {fmt(s.end_time)}</span>
                      {s.is_booked ? (
                        <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs">Reservado</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                          {deletingId === s.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Trash2 className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ============= SESSOES TAB =============
function SessoesTab({ sessions }: { sessions: Session[] }) {
  const [filter, setFilter] = useState<'todas' | 'agendada' | 'concluida' | 'cancelada'>('todas')
  const [isPending, startTransition] = useTransition()
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const filtered = useMemo(() => {
    if (filter === 'todas') return sessions
    return sessions.filter(s => s.status === filter)
  }, [sessions, filter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: sessions.length }
    for (const s of sessions) c[s.status] = (c[s.status] || 0) + 1
    return c
  }, [sessions])

  function handleStatus(id: string, status: 'concluida' | 'cancelada') {
    setActioningId(id)
    startTransition(async () => {
      const r = await updateSessionStatus(id, status)
      r?.error ? toast.error(r.error) : toast.success(status === 'concluida' ? 'Sessão concluída!' : 'Sessão cancelada.')
      setActioningId(null)
      setSelectedSession(null)
    })
  }

  const STATUS_STYLES: Record<string, { badge: string; border: string }> = {
    agendada: { badge: 'bg-info/10 text-info border-info/20', border: 'border-l-info' },
    concluida: { badge: 'bg-success/10 text-success border-success/20', border: 'border-l-success' },
    cancelada: { badge: 'bg-destructive/10 text-destructive border-destructive/20', border: 'border-l-muted' },
  }

  const FILTERS = [
    { value: 'todas' as const, label: 'Todas' },
    { value: 'agendada' as const, label: 'Agendadas' },
    { value: 'concluida' as const, label: 'Concluídas' },
    { value: 'cancelada' as const, label: 'Canceladas' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 rounded-lg bg-muted/50 p-1">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
            filter === f.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}>
            {f.label}
            {(counts[f.value] ?? 0) > 0 && (
              <span className={cn('ml-1.5 text-xs rounded-full px-1.5 tabular-nums', filter === f.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium">Nenhuma sessão encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s, i) => {
            const style = STATUS_STYLES[s.status] ?? STATUS_STYLES.agendada
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card
                  className={cn('border-l-[3px] cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all', style.border, s.status === 'cancelada' && 'opacity-60')}
                  onClick={() => setSelectedSession(s)}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 min-w-0">
                        {/* Date block */}
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-info/10 text-info">
                          <span className="text-sm font-bold leading-none">{format(parseISO(s.scheduled_date), 'dd')}</span>
                          <span className="text-[10px] uppercase">{format(parseISO(s.scheduled_date), 'MMM', { locale: ptBR })}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{s.topic}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                            <span className="tabular-nums">{fmt(s.scheduled_start)} - {fmt(s.scheduled_end)}</span>
                            {s.profiles && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {s.profiles.full_name}
                                </span>
                              </>
                            )}
                            {s.profiles?.department && (
                              <>
                                <span>·</span>
                                <span>{s.profiles.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={style.badge}>
                          {s.status === 'agendada' ? 'Agendada' : s.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Session detail Sheet */}
      <Sheet open={!!selectedSession} onOpenChange={o => !o && setSelectedSession(null)}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
          {selectedSession && (() => {
            const s = selectedSession
            const style = STATUS_STYLES[s.status] ?? STATUS_STYLES.agendada
            return (
              <>
                <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                  <div className="flex items-start justify-between gap-3 pr-6">
                    <SheetTitle className="text-base leading-snug">{s.topic}</SheetTitle>
                    <Badge variant="outline" className={style.badge}>
                      {s.status === 'agendada' ? 'Agendada' : s.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                    </Badge>
                  </div>
                </SheetHeader>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="px-6 py-5 space-y-5">
                    {/* Date/Time */}
                    <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-4">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-info/10 text-info">
                        <span className="text-lg font-bold leading-none">{format(parseISO(s.scheduled_date), 'dd')}</span>
                        <span className="text-[11px] uppercase">{format(parseISO(s.scheduled_date), 'MMM', { locale: ptBR })}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{fmtDate(s.scheduled_date)}</p>
                        <p className="text-sm text-muted-foreground tabular-nums">{fmt(s.scheduled_start)} - {fmt(s.scheduled_end)}</p>
                      </div>
                    </div>

                    {/* Collaborator */}
                    {s.profiles && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colaborador</h4>
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                          <Avatar className="h-10 w-10">
                            {s.profiles.avatar_url && <AvatarImage src={s.profiles.avatar_url} />}
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials(s.profiles.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{s.profiles.full_name}</p>
                            <p className="text-xs text-muted-foreground">{s.profiles.email}</p>
                            {s.profiles.department && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3" />{s.profiles.department}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {s.notes && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Anotações do colaborador</h4>
                        <div className="rounded-lg border-l-2 border-info bg-muted/30 px-3 py-2">
                          <p className="text-sm text-foreground/80">{s.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Footer actions */}
                {s.status === 'agendada' && (
                  <div className="shrink-0 border-t px-6 py-4 flex gap-2">
                    <Button
                      className="flex-1 gap-1.5"
                      onClick={() => handleStatus(s.id, 'concluida')}
                      disabled={isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Concluir
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => handleStatus(s.id, 'cancelada')}
                      disabled={isPending}
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </>
            )
          })()}
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}
