'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge'
import { TicketTimeline } from '@/components/tickets/ticket-timeline'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CheckCircle, XCircle, MessageSquare, Wrench, Plus,
  RotateCcw, AlertCircle, ArrowRight,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TICKET_STATUS_LABELS } from '@/lib/constants'
import { getTicketEvents } from '@/actions/tickets'
import type { EventType, TicketStatus } from '@/lib/types/enums'
import Link from 'next/link'

const EVENT_ICONS: Record<EventType, React.ElementType> = {
  created: Plus,
  status_changed: CheckCircle,
  substatus_changed: Wrench,
  observation_added: MessageSquare,
  reopen_requested: AlertCircle,
  reopened: RotateCcw,
}

const EVENT_DESCRIPTIONS: Record<EventType, string> = {
  created: 'submeteu uma ideia',
  status_changed: 'atualizou o status',
  substatus_changed: 'atualizou a etapa de dev',
  observation_added: 'adicionou observação',
  reopen_requested: 'solicitou reabertura',
  reopened: 'reabriu o chamado',
}

interface ActivityEvent {
  id: string
  ticket_id: string
  event_type: EventType
  old_value: string | null
  new_value: string | null
  comment: string | null
  created_at: string
  profiles: { full_name: string; avatar_url: string | null } | null
  tickets: { id: string; title: string; status: string; department: string; description: string } | null
}

interface SheetTicket {
  id: string
  title: string
  status: string
  department: string
  description: string
  events: Array<{
    id: string
    event_type: EventType
    old_value: string | null
    new_value: string | null
    comment: string | null
    created_at: string
    profiles: { full_name: string } | null
  }>
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const [selectedTicket, setSelectedTicket] = useState<SheetTicket | null>(null)
  const [loading, setLoading] = useState(false)

  const openTicketSheet = useCallback(async (event: ActivityEvent) => {
    if (!event.tickets) return
    setLoading(true)

    const { events: ticketEvents } = await getTicketEvents(event.ticket_id)

    setSelectedTicket({
      id: event.ticket_id,
      title: event.tickets.title,
      status: event.tickets.status,
      department: event.tickets.department,
      description: event.tickets.description,
      events: ticketEvents as unknown as SheetTicket['events'],
    })
    setLoading(false)
  }, [])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
          ) : (
            <div className="space-y-1">
              {events.map((event) => {
                const initials = event.profiles?.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() ?? '?'

                return (
                  <button
                    key={event.id}
                    onClick={() => openTicketSheet(event)}
                    disabled={loading}
                    className="w-full text-left flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors group"
                  >
                    <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                      <AvatarImage src={event.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm leading-snug">
                        <span className="font-medium">{event.profiles?.full_name ?? 'Usuário'}</span>{' '}
                        <span className="text-muted-foreground">{EVENT_DESCRIPTIONS[event.event_type]}</span>
                      </p>
                      {event.tickets?.title && (
                        <p className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">
                          {event.tickets.title}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet de preview do ticket */}
      <Sheet open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col" side="right">
          {selectedTicket && (
            <>
              <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                <div className="flex items-start justify-between gap-3 pr-6">
                  <div className="space-y-1 min-w-0">
                    <SheetTitle className="text-base leading-snug">{selectedTicket.title}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{selectedTicket.department}</p>
                  </div>
                  <TicketStatusBadge status={selectedTicket.status as TicketStatus} />
                </div>
              </SheetHeader>
              <ScrollArea className="flex-1 min-h-0">
                <div className="px-6 py-4 space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 line-clamp-6">
                      {selectedTicket.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</h4>
                    {selectedTicket.events.length > 0 ? (
                      <TicketTimeline events={selectedTicket.events} />
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhum evento.</p>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <div className="shrink-0 border-t border-border px-6 py-4">
                <Button asChild className="w-full gap-1.5">
                  <Link href={`/admin/projetos/${selectedTicket.id}`}>
                    Ver detalhes completos
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
