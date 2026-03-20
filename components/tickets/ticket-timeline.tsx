import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle, XCircle, MessageSquare, Wrench, Plus, RotateCcw, AlertCircle } from 'lucide-react'
import { TICKET_STATUS_LABELS, DEV_SUBSTATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { EventType, TicketStatus, DevSubstatus } from '@/lib/types/enums'

const EVENT_ICONS: Record<EventType, React.ElementType> = {
  created: Plus,
  status_changed: CheckCircle,
  substatus_changed: Wrench,
  observation_added: MessageSquare,
  reopen_requested: AlertCircle,
  reopened: RotateCcw,
}

const EVENT_LABELS: Record<EventType, string> = {
  created: 'Chamado criado',
  status_changed: 'Status atualizado',
  substatus_changed: 'Etapa de desenvolvimento atualizada',
  observation_added: 'Observação adicionada',
  reopen_requested: 'Reabertura solicitada',
  reopened: 'Chamado reaberto',
}

type EventColorScheme = {
  icon: string
  bg: string
  border: string
}

function getEventColor(eventType: EventType, newValue: string | null): EventColorScheme {
  switch (eventType) {
    case 'created':
      return {
        icon: 'text-primary',
        bg: 'bg-primary/15',
        border: 'border-primary/30',
      }
    case 'status_changed': {
      if (newValue === 'aprovado' || newValue === 'concluido') {
        return {
          icon: 'text-success',
          bg: 'bg-success/15',
          border: 'border-success/30',
        }
      }
      if (newValue === 'recusado') {
        return {
          icon: 'text-destructive',
          bg: 'bg-destructive/15',
          border: 'border-destructive/30',
        }
      }
      return {
        icon: 'text-info',
        bg: 'bg-info/15',
        border: 'border-info/30',
      }
    }
    case 'substatus_changed':
      return {
        icon: 'text-info',
        bg: 'bg-info/15',
        border: 'border-info/30',
      }
    case 'observation_added':
      return {
        icon: 'text-secondary',
        bg: 'bg-secondary/15',
        border: 'border-secondary/30',
      }
    case 'reopen_requested':
      return {
        icon: 'text-warning',
        bg: 'bg-warning/15',
        border: 'border-warning/30',
      }
    case 'reopened':
      return {
        icon: 'text-info',
        bg: 'bg-info/15',
        border: 'border-info/30',
      }
  }
}

interface TimelineEvent {
  id: string
  event_type: EventType
  old_value: string | null
  new_value: string | null
  comment: string | null
  created_at: string
  profiles: { full_name: string } | null
}

export function TicketTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        // Use XCircle for rejected status changes
        const Icon = (event.event_type === 'status_changed' && event.new_value === 'recusado')
          ? XCircle
          : EVENT_ICONS[event.event_type]
        const isLast = index === events.length - 1
        const colors = getEventColor(event.event_type, event.new_value)

        return (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border',
                  colors.bg,
                  colors.border
                )}
              >
                <Icon className={cn('h-4 w-4', colors.icon)} />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-border mt-1" />
              )}
            </div>
            <div className="pb-6 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold">{EVENT_LABELS[event.event_type]}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {event.event_type === 'status_changed' && event.new_value && (
                <p className="text-xs text-muted-foreground mt-1">
                  {event.old_value ? `${TICKET_STATUS_LABELS[event.old_value as TicketStatus] ?? event.old_value} → ` : ''}
                  {TICKET_STATUS_LABELS[event.new_value as TicketStatus] ?? event.new_value}
                </p>
              )}
              {event.event_type === 'substatus_changed' && event.new_value && (
                <p className="text-xs text-muted-foreground mt-1">
                  {DEV_SUBSTATUS_LABELS[event.new_value as DevSubstatus] ?? event.new_value}
                </p>
              )}
              {event.event_type === 'reopened' && event.old_value && (
                <p className="text-xs text-muted-foreground mt-1">
                  {TICKET_STATUS_LABELS[event.old_value as TicketStatus] ?? event.old_value} → Em Desenvolvimento
                </p>
              )}
              {event.event_type === 'reopen_requested' && (
                <p className="text-xs text-warning mt-1">
                  Aguardando aprovação do admin
                </p>
              )}
              {event.comment && (
                <div
                  className={cn(
                    'mt-2 rounded-md px-3 py-2 border-l-2 bg-muted/30',
                    colors.icon.replace('text-', 'border-l-')
                  )}
                >
                  <p className="text-sm text-foreground/80">{event.comment}</p>
                </div>
              )}
              {event.profiles && (
                <p className="text-xs text-muted-foreground mt-1.5">por {event.profiles.full_name}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
