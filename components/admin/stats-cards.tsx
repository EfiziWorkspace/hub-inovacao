'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  TrendingUp, TrendingDown, ArrowRight,
  CircleDot, Loader, CheckCircle2, XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DISPLAY_STATUS_LABELS,
  DISPLAY_STATUS_COLORS,
  DISPLAY_STATUS_DOT_COLORS,
  type DisplayStatus,
} from '@/lib/constants'
import type { TicketStatus } from '@/lib/types/enums'
import { getDisplayStatus } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface StatusPillData {
  display: DisplayStatus
  count: number
  trend?: number
}

interface TicketItem {
  id: string
  title: string
  department: string
  status: string
  updated_at: string
  profiles: { full_name: string } | null
}

interface StatsCardsProps {
  pills: StatusPillData[]
  ticketsByStatus: Record<DisplayStatus, TicketItem[]>
  isAdmin?: boolean
}

const STATUS_ICONS: Record<DisplayStatus, typeof CircleDot> = {
  aberto: CircleDot,
  em_andamento: Loader,
  concluido: CheckCircle2,
  recusado: XCircle,
}

const STATUS_ICON_BG: Record<DisplayStatus, string> = {
  aberto: 'bg-warning/15',
  em_andamento: 'bg-info/15',
  concluido: 'bg-success/15',
  recusado: 'bg-destructive/15',
}

const STATUS_ICON_COLOR: Record<DisplayStatus, string> = {
  aberto: 'text-warning',
  em_andamento: 'text-info',
  concluido: 'text-success',
  recusado: 'text-destructive',
}

const STATUS_HOVER_BORDER: Record<DisplayStatus, string> = {
  aberto: 'hover:border-warning/50',
  em_andamento: 'hover:border-info/50',
  concluido: 'hover:border-success/50',
  recusado: 'hover:border-destructive/50',
}

const STATUS_WATERMARK_COLOR: Record<DisplayStatus, string> = {
  aberto: 'text-warning',
  em_andamento: 'text-info',
  concluido: 'text-success',
  recusado: 'text-destructive',
}

export function StatsCards({ pills, ticketsByStatus, isAdmin }: StatsCardsProps) {
  const [activeStatus, setActiveStatus] = useState<DisplayStatus | null>(null)
  const activeTickets = activeStatus ? ticketsByStatus[activeStatus] ?? [] : []

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pills.map((pill) => {
          const Icon = STATUS_ICONS[pill.display]
          return (
            <button
              key={pill.display}
              onClick={() => setActiveStatus(pill.display)}
              className="group text-left"
            >
              <Card className={cn(
                'relative overflow-hidden transition-all duration-200 cursor-pointer',
                'hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10',
                STATUS_HOVER_BORDER[pill.display],
                activeStatus === pill.display && 'border-primary/60 ring-2 ring-primary/30'
              )}>
                {/* Watermark icon */}
                <Icon className={cn(
                  'absolute right-2 bottom-2 h-16 w-16 opacity-[0.04] pointer-events-none',
                  STATUS_WATERMARK_COLOR[pill.display]
                )} />

                <CardContent className="relative pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'flex items-center justify-center h-8 w-8 rounded-full',
                        STATUS_ICON_BG[pill.display]
                      )}>
                        <Icon className={cn('h-4 w-4', STATUS_ICON_COLOR[pill.display])} />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {DISPLAY_STATUS_LABELS[pill.display]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-4xl font-bold">{pill.count}</p>
                    {pill.trend !== undefined && pill.trend !== 0 && (
                      <span className={cn(
                        'flex items-center gap-0.5 text-xs font-medium',
                        pill.trend > 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {pill.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {pill.trend > 0 ? '+' : ''}{pill.trend}
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Clique para ver
                    <ArrowRight className="h-2.5 w-2.5" />
                  </p>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      <Sheet open={!!activeStatus} onOpenChange={(open) => !open && setActiveStatus(null)}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col" side="right">
          {activeStatus && (
            <>
              <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className={cn('h-3 w-3 rounded-full', DISPLAY_STATUS_DOT_COLORS[activeStatus])} />
                  <SheetTitle>{DISPLAY_STATUS_LABELS[activeStatus]}</SheetTitle>
                  <Badge variant="outline" className="ml-auto">{activeTickets.length}</Badge>
                </div>
              </SheetHeader>
              <ScrollArea className="flex-1 min-h-0">
                <div className="px-6 py-4 space-y-2">
                  {activeTickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum chamado neste status.</p>
                  ) : (
                    activeTickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={isAdmin ? `/admin/projetos/${ticket.id}` : `/app/${ticket.id}`}
                        className="block rounded-xl border border-border p-3.5 hover:border-primary/40 hover:bg-muted/40 transition-colors"
                      >
                        <p className="text-sm font-medium truncate">{ticket.title}</p>
                        <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                          <span>{ticket.profiles?.full_name ?? '\u2014'} · {ticket.department}</span>
                          <span>{formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: ptBR })}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
