'use client'

import { useTransition, useState, useMemo } from 'react'
import { format, parseISO, addDays, addWeeks, startOfWeek, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, Plus, Trash2, CalendarCheck,
  Sunrise, Sun, Coffee, Repeat, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { createAvailabilitySlots, deleteAvailabilitySlot } from '@/actions/mentoring'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
  is_booked: boolean
  created_at: string
}

const TIME_OPTIONS = Array.from({ length: 11 }, (_, i) => {
  const hour = i + 8
  return `${String(hour).padStart(2, '0')}:00`
})

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

function formatTime(time: string) {
  return time.slice(0, 5)
}

function formatDateLabel(dateStr: string) {
  const date = parseISO(dateStr)
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
}

function formatDateShort(dateStr: string) {
  const date = parseISO(dateStr)
  return format(date, "EEE dd/MM", { locale: ptBR })
}

export function AvailabilityManager({ slots }: { slots: Slot[] }) {
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
    for (const slot of slots) {
      if (!groups[slot.date]) groups[slot.date] = []
      groups[slot.date].push(slot)
    }
    return groups
  }, [slots])

  const existingTimesForDate = useMemo(() => {
    if (!selectedDate) return new Set<string>()
    return new Set(
      (groupedSlots[selectedDate] ?? []).map((s) => formatTime(s.start_time))
    )
  }, [selectedDate, groupedSlots])

  function toggleTime(time: string) {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    )
  }

  function toggleDay(dayIndex: number) {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    )
  }

  function applyPreset(times: string[]) {
    const filtered = skipLunch
      ? times.filter((t) => t !== '12:00')
      : times
    setSelectedTimes(filtered)
  }

  function applyRange(start: string, end: string) {
    const startH = parseInt(start)
    const endH = parseInt(end)
    if (startH >= endH) return
    const times: string[] = []
    for (let h = startH; h < endH; h++) {
      const t = `${String(h).padStart(2, '0')}:00`
      if (skipLunch && t === '12:00') continue
      times.push(t)
    }
    setSelectedTimes(times)
  }

  // Generate dates for bulk mode
  function getBulkDates(): string[] {
    const today = new Date()
    const dates: string[] = []
    for (let week = 0; week < repeatWeeks; week++) {
      const weekStart = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), week)
      for (const day of selectedDays) {
        const date = addDays(weekStart, day - 1)
        if (!isBefore(date, today)) {
          dates.push(format(date, 'yyyy-MM-dd'))
        }
      }
    }
    return [...new Set(dates)].sort()
  }

  async function handleAddSlots() {
    if (selectedTimes.length === 0) {
      toast.error('Selecione pelo menos um horário.')
      return
    }

    let dates: string[] = []

    if (mode === 'single') {
      if (!selectedDate) {
        toast.error('Selecione uma data.')
        return
      }
      dates = [selectedDate]
    } else {
      if (selectedDays.length === 0) {
        toast.error('Selecione pelo menos um dia da semana.')
        return
      }
      dates = getBulkDates()
      if (dates.length === 0) {
        toast.error('Nenhuma data futura encontrada para os dias selecionados.')
        return
      }
    }

    startTransition(async () => {
      let totalCreated = 0
      let errors = 0

      for (const date of dates) {
        const formData = new FormData()
        formData.set('date', date)
        formData.set('slots', JSON.stringify(selectedTimes))
        const result = await createAvailabilitySlots(formData)
        if (result?.error) {
          errors++
        } else {
          totalCreated++
        }
      }

      if (totalCreated > 0) {
        const totalSlots = totalCreated * selectedTimes.length
        toast.success(`${totalSlots} horário(s) criados em ${totalCreated} dia(s)`)
      }
      if (errors > 0) {
        toast.warning(`${errors} dia(s) tiveram conflito com horários existentes.`)
      }

      setSelectedTimes([])
      setSelectedDate('')
      setSelectedDays([])
    })
  }

  function handleDeleteSlot(slotId: string) {
    setDeletingId(slotId)
    startTransition(async () => {
      const result = await deleteAvailabilitySlot(slotId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Horário removido')
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-8">
      {/* Add slots section */}
      <Card className="border-l-[3px] border-l-info">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-info" />
              Adicionar horários
            </span>
            {/* Mode toggle */}
            <div className="flex gap-1 rounded-full border border-border p-0.5">
              <button
                onClick={() => setMode('single')}
                className={cn(
                  'text-xs px-3 py-1 rounded-full transition-colors',
                  mode === 'single' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Data única
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={cn(
                  'text-xs px-3 py-1 rounded-full transition-colors',
                  mode === 'bulk' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Em massa
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Date selection */}
          {mode === 'single' ? (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Data
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setSelectedTimes([])
                }}
                min={new Date().toISOString().split('T')[0]}
                className="max-w-xs"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Weekday selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Dias da semana
                </Label>
                <div className="flex gap-2">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.index}
                      onClick={() => toggleDay(day.index)}
                      className={cn(
                        'h-10 w-12 rounded-lg border text-sm font-medium transition-all',
                        selectedDays.includes(day.index)
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repeat weeks */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Repeat className="h-3.5 w-3.5" />
                  Repetir por
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((w) => (
                    <button
                      key={w}
                      onClick={() => setRepeatWeeks(w)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-sm transition-all',
                        repeatWeeks === w
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {w} {w === 1 ? 'semana' : 'semanas'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview dates */}
              {selectedDays.length > 0 && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1.5">Datas que serão criadas:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {getBulkDates().map((d) => (
                      <Badge key={d} variant="outline" className="text-[10px] capitalize">
                        {formatDateShort(d)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Time selection */}
          {(mode === 'single' ? !!selectedDate : selectedDays.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Presets */}
              <div className="flex items-center gap-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Horários
                </Label>
                <div className="flex gap-1.5 ml-auto">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => applyPreset(preset.times)}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:border-info/50 hover:text-info transition-colors flex items-center gap-1"
                    >
                      <preset.icon className="h-3 w-3" />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skip lunch */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="skip-lunch"
                  checked={skipLunch}
                  onCheckedChange={(v) => setSkipLunch(v === true)}
                />
                <label htmlFor="skip-lunch" className="text-xs text-muted-foreground cursor-pointer">
                  Pular horário de almoço (12:00)
                </label>
              </div>

              {/* Time grid */}
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map((time) => {
                  const isSelected = selectedTimes.includes(time)
                  const isExisting = mode === 'single' && existingTimesForDate.has(time)
                  const isLunch = time === '12:00' && skipLunch
                  return (
                    <Button
                      key={time}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      disabled={isExisting || isLunch}
                      onClick={() => toggleTime(time)}
                      className={cn(
                        'min-w-[72px] tabular-nums transition-all',
                        isSelected && 'ring-2 ring-primary/30',
                        (isExisting || isLunch) && 'line-through opacity-30'
                      )}
                    >
                      {time}
                    </Button>
                  )
                })}
              </div>

              {selectedTimes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedTimes.length} horário(s) selecionado(s)
                  {mode === 'bulk' && ` × ${getBulkDates().length} dia(s) = ${selectedTimes.length * getBulkDates().length} slots`}
                </p>
              )}
            </motion.div>
          )}

          <Button
            onClick={handleAddSlots}
            disabled={isPending || selectedTimes.length === 0 || (mode === 'single' ? !selectedDate : selectedDays.length === 0)}
            className="gap-2"
          >
            {isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {mode === 'bulk'
              ? `Criar ${selectedTimes.length * getBulkDates().length} horários`
              : 'Adicionar horários'
            }
          </Button>
        </CardContent>
      </Card>

      {/* Slots list grouped by date */}
      {Object.keys(groupedSlots).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="font-medium text-lg">Nenhum horário cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione horários para que colaboradores possam agendar mentoria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Horários cadastrados
          </h2>
          <AnimatePresence mode="popLayout">
            {Object.entries(groupedSlots).map(([date, dateSlots], groupIdx) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: groupIdx * 0.05 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm capitalize">
                      <CalendarCheck className="h-4 w-4 text-info" />
                      {formatDateLabel(date)}
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {dateSlots.length} slot(s)
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {dateSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                            slot.is_booked
                              ? 'bg-success/5 border-success/20'
                              : 'hover:bg-muted/50'
                          )}
                        >
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="tabular-nums font-medium">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </span>
                          {slot.is_booked ? (
                            <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs">
                              Reservado
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSlot(slot.id)}
                              disabled={deletingId === slot.id}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              {deletingId === slot.id ? (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
