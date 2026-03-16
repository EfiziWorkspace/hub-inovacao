'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { TicketStatus } from '@/lib/types/enums'

interface StalledTicket {
  id: string
  title: string
  status: string
  department: string
  updated_at: string
  profiles: { full_name: string } | null
}

function getDaysStalled(updatedAt: string): number {
  const now = new Date()
  const updated = new Date(updatedAt)
  const diffMs = now.getTime() - updated.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function getStalenessLevel(days: number) {
  if (days >= 21) {
    return {
      border: 'border-destructive/30',
      bg: 'bg-destructive/5',
      dayColor: 'text-destructive',
      dayBg: 'bg-destructive/10',
      timeColor: 'text-destructive',
    }
  }
  if (days >= 14) {
    return {
      border: 'border-primary/30',
      bg: 'bg-primary/5',
      dayColor: 'text-primary',
      dayBg: 'bg-primary/10',
      timeColor: 'text-primary',
    }
  }
  return {
    border: 'border-warning/20',
    bg: 'bg-warning/5',
    dayColor: 'text-warning',
    dayBg: 'bg-warning/10',
    timeColor: 'text-warning',
  }
}

export function StalledTickets({ tickets }: { tickets: StalledTicket[] }) {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Chamados Parados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum chamado parado. Tudo em dia!
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort by most stalled first
  const sortedTickets = [...tickets].sort((a, b) => {
    return getDaysStalled(b.updated_at) - getDaysStalled(a.updated_at)
  })

  return (
    <Card className="border-warning/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Chamados Parados
          <span className="text-xs font-normal text-muted-foreground">
            sem atualização há +7 dias
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedTickets.map((ticket) => {
          const days = getDaysStalled(ticket.updated_at)
          const staleness = getStalenessLevel(days)

          return (
            <div
              key={ticket.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                staleness.bg,
                'border',
                staleness.border
              )}
            >
              {/* Days indicator */}
              <div className={cn(
                'flex flex-col items-center justify-center shrink-0 w-14 h-14 rounded-lg',
                staleness.dayBg
              )}>
                <span className={cn('text-xl font-bold leading-none', staleness.dayColor)}>
                  {days}
                </span>
                <span className={cn('text-[10px] font-medium mt-0.5', staleness.dayColor)}>
                  {days === 1 ? 'dia' : 'dias'}
                </span>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{ticket.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <TicketStatusBadge status={ticket.status as TicketStatus} />
                  <span className="text-xs text-muted-foreground">
                    {ticket.department} · {ticket.profiles?.full_name ?? '—'}
                  </span>
                </div>
              </div>

              {/* Action */}
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link href={`/admin/projetos/${ticket.id}`}>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
