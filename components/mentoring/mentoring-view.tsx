'use client'

import { useState, useTransition, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  CalendarCheck,
  CalendarX,
  User,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { bookMentoringSession } from '@/actions/mentoring'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AvailableSlot {
  id: string
  admin_id: string
  date: string
  start_time: string
  end_time: string
  profiles: { full_name: string; avatar_url: string | null } | null
}

interface MySession {
  id: string
  scheduled_date: string
  scheduled_start: string
  scheduled_end: string
  topic: string
  notes: string | null
  status: string
  created_at: string
  profiles: { full_name: string; avatar_url: string | null } | null
}

interface MentoringViewProps {
  availableSlots: AvailableSlot[]
  mySessions: MySession[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(timeStr: string): string {
  // HH:MM:SS → HH:MM
  return timeStr.slice(0, 5)
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr)
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

type Tab = 'agendar' | 'sessoes'

const STATUS_CONFIG: Record<string, { label: string; className: string; dotClass: string }> = {
  agendada: {
    label: 'Agendada',
    className: 'bg-info/10 text-info border-info/20',
    dotClass: 'bg-info',
  },
  concluida: {
    label: 'Concluída',
    className: 'bg-success/10 text-success border-success/20',
    dotClass: 'bg-success',
  },
  cancelada: {
    label: 'Cancelada',
    className: 'bg-muted text-muted-foreground border-border',
    dotClass: 'bg-muted-foreground',
  },
}

const STATUS_BORDER: Record<string, string> = {
  agendada: 'border-l-info',
  concluida: 'border-l-success',
  cancelada: 'border-l-muted-foreground/40',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MentoringView({ availableSlots, mySessions }: MentoringViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('agendar')
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const groups: Record<string, AvailableSlot[]> = {}
    for (const slot of availableSlots) {
      if (!groups[slot.date]) groups[slot.date] = []
      groups[slot.date].push(slot)
    }
    return Object.entries(groups)
  }, [availableSlots])

  // Group sessions by status
  const sessionsByStatus = useMemo(() => {
    const agendadas: MySession[] = []
    const concluidas: MySession[] = []
    const canceladas: MySession[] = []

    for (const s of mySessions) {
      if (s.status === 'agendada') agendadas.push(s)
      else if (s.status === 'concluida') concluidas.push(s)
      else canceladas.push(s)
    }

    return [
      { key: 'agendada', label: 'Agendadas', items: agendadas },
      { key: 'concluida', label: 'Concluídas', items: concluidas },
      { key: 'cancelada', label: 'Canceladas', items: canceladas },
    ].filter((g) => g.items.length > 0)
  }, [mySessions])

  function handleBook() {
    if (!formRef.current || !selectedSlot) return

    const formData = new FormData(formRef.current)
    formData.set('availability_id', selectedSlot.id)

    const topic = formData.get('topic') as string
    if (!topic?.trim()) {
      toast.error('Informe o tema da mentoria.')
      return
    }

    startTransition(async () => {
      const result = await bookMentoringSession(formData)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success('Mentoria agendada com sucesso!')
      setSelectedSlot(null)
      formRef.current?.reset()
    })
  }

  // Tab counts
  const agendadasCount = mySessions.filter((s) => s.status === 'agendada').length

  return (
    <div className="space-y-6">
      {/* Gradient header */}
      <div className="relative -mx-6 lg:-mx-8 -mt-6 px-6 lg:px-8 pt-6 pb-6 bg-gradient-to-b from-info/8 via-info/3 to-transparent">
        <div>
          <h1 className="text-2xl font-bold">Mentoria</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agende uma sessão de mentoria com um dos nossos especialistas
          </p>
        </div>
      </div>

      {/* Pill tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('agendar')}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap text-sm px-4 py-2 rounded-full border transition-all duration-200',
            activeTab === 'agendar'
              ? 'bg-info/15 text-info border-info/30 shadow-sm'
              : 'border-border text-muted-foreground hover:border-info/40 hover:text-info'
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          Agendar
          {availableSlots.length > 0 && (
            <span
              className={cn(
                'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold',
                activeTab === 'agendar' ? 'bg-info/20' : 'bg-muted text-muted-foreground'
              )}
            >
              {availableSlots.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sessoes')}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap text-sm px-4 py-2 rounded-full border transition-all duration-200',
            activeTab === 'sessoes'
              ? 'bg-foreground text-background border-foreground shadow-sm'
              : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
          )}
        >
          <CalendarCheck className="h-3.5 w-3.5" />
          Minhas Sessões
          {agendadasCount > 0 && (
            <span
              className={cn(
                'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold',
                activeTab === 'sessoes'
                  ? 'bg-background/20 text-background'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {agendadasCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'agendar' ? (
          <motion.div
            key="agendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {slotsByDate.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-info/10 blur-xl scale-150" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-info/15 to-info/5 border border-info/10">
                    <CalendarX className="h-12 w-12 text-info" />
                  </div>
                </div>
                <h2 className="text-xl font-bold">Nenhum horário disponível no momento</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
                  Novos horários serão abertos em breve. Volte depois para agendar sua mentoria.
                </p>
              </motion.div>
            ) : (
              slotsByDate.map(([date, slots], dateIdx) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: dateIdx * 0.06 }}
                  className="space-y-3"
                >
                  {/* Date header */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10">
                      <Calendar className="h-4 w-4 text-info" />
                    </div>
                    <h3 className="text-sm font-semibold capitalize">
                      {formatDateLabel(date)}
                    </h3>
                  </div>

                  {/* Slot cards */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {slots.map((slot, slotIdx) => (
                      <motion.div
                        key={slot.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: dateIdx * 0.06 + slotIdx * 0.04,
                        }}
                      >
                        <Card className="border border-l-[3px] border-l-info transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-border/80">
                          <CardContent className="py-4 px-5 space-y-3">
                            {/* Time */}
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Clock className="h-4 w-4 text-info" />
                              <span>
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                            </div>

                            {/* Admin */}
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-7 w-7">
                                <AvatarImage
                                  src={slot.profiles?.avatar_url ?? undefined}
                                  alt={slot.profiles?.full_name ?? 'Mentor'}
                                />
                                <AvatarFallback className="text-[10px] bg-info/10 text-info">
                                  {slot.profiles?.full_name
                                    ? getInitials(slot.profiles.full_name)
                                    : <User className="h-3 w-3" />}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground truncate">
                                {slot.profiles?.full_name ?? 'Mentor'}
                              </span>
                            </div>

                            {/* Book button */}
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => setSelectedSlot(slot)}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Agendar
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="sessoes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-8"
          >
            {mySessions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-muted/50 blur-xl scale-150" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border">
                    <CalendarCheck className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
                <h2 className="text-xl font-bold">Você ainda não agendou nenhuma mentoria</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
                  Vá para a aba &quot;Agendar&quot; e escolha um horário disponível.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setActiveTab('agendar')}
                >
                  <Calendar className="h-4 w-4" />
                  Ver horários disponíveis
                </Button>
              </motion.div>
            ) : (
              sessionsByStatus.map((group) => (
                <div key={group.key} className="space-y-3">
                  {/* Group label */}
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        STATUS_CONFIG[group.key]?.dotClass ?? 'bg-muted-foreground'
                      )}
                    />
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {group.label}
                    </h3>
                    <span className="text-xs text-muted-foreground/60">
                      ({group.items.length})
                    </span>
                  </div>

                  {/* Session cards */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((session, i) => {
                      const status = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.cancelada
                      const borderClass = STATUS_BORDER[session.status] ?? STATUS_BORDER.cancelada

                      return (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.04 }}
                        >
                          <Card
                            className={cn(
                              'border border-l-[3px] transition-all duration-200',
                              'hover:-translate-y-0.5 hover:shadow-md hover:border-border/80',
                              borderClass
                            )}
                          >
                            <CardContent className="py-4 px-5 space-y-3">
                              {/* Status badge */}
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className={cn('text-[11px]', status.className)}
                                >
                                  <span
                                    className={cn(
                                      'h-1.5 w-1.5 rounded-full',
                                      status.dotClass
                                    )}
                                  />
                                  {status.label}
                                </Badge>
                              </div>

                              {/* Topic */}
                              <h4 className="font-semibold text-sm leading-snug line-clamp-2">
                                {session.topic}
                              </h4>

                              {/* Date & time */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(session.scheduled_date), "d 'de' MMM", {
                                    locale: ptBR,
                                  })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(session.scheduled_start)} -{' '}
                                  {formatTime(session.scheduled_end)}
                                </span>
                              </div>

                              {/* Admin */}
                              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={session.profiles?.avatar_url ?? undefined}
                                    alt={session.profiles?.full_name ?? 'Mentor'}
                                  />
                                  <AvatarFallback className="text-[9px]">
                                    {session.profiles?.full_name
                                      ? getInitials(session.profiles.full_name)
                                      : '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground truncate">
                                  {session.profiles?.full_name ?? 'Mentor'}
                                </span>
                              </div>

                              {/* Notes preview */}
                              {session.notes && (
                                <p className="text-xs text-muted-foreground/70 line-clamp-2 italic">
                                  <MessageSquare className="inline h-3 w-3 mr-1 -mt-0.5" />
                                  {session.notes}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking dialog */}
      <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar mentoria</DialogTitle>
          </DialogHeader>

          {selectedSlot && (
            <form ref={formRef} className="space-y-5">
              {/* Slot info summary */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-info" />
                  <span className="font-medium capitalize">
                    {formatDateLabel(selectedSlot.date)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-info" />
                  <span>
                    {formatTime(selectedSlot.start_time)} -{' '}
                    {formatTime(selectedSlot.end_time)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={selectedSlot.profiles?.avatar_url ?? undefined}
                      alt={selectedSlot.profiles?.full_name ?? 'Mentor'}
                    />
                    <AvatarFallback className="text-[8px]">
                      {selectedSlot.profiles?.full_name
                        ? getInitials(selectedSlot.profiles.full_name)
                        : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedSlot.profiles?.full_name ?? 'Mentor'}</span>
                </div>
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <Label htmlFor="topic">Sobre o que você quer conversar? *</Label>
                <Input
                  id="topic"
                  name="topic"
                  placeholder="Ex: Carreira em tech, feedback do meu projeto..."
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">
                  Algo mais que o mentor deva saber?{' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Contexto adicional, links, dúvidas específicas..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedSlot(null)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleBook}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Agendando...
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="h-4 w-4" />
                      Confirmar agendamento
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
