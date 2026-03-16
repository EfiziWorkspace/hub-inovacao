import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TicketStatusBadge } from './ticket-status-badge'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Building2, Check, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import type { TicketStatus, DevSubstatus } from '@/lib/types/enums'
import { OPEN_SUB_LABELS, getDisplayStatus, type DisplayStatus } from '@/lib/constants'
import { cn } from '@/lib/utils'

const ACCENT_BORDERS: Record<DisplayStatus, string> = {
  aberto: 'border-l-warning',
  em_andamento: 'border-l-info',
  concluido: 'border-l-success',
  recusado: 'border-l-destructive',
}

interface TicketCardProps {
  ticket: {
    id: string
    title: string
    department: string
    status: TicketStatus
    dev_substatus: DevSubstatus | null
    created_at: string
  }
}

const SUB_ICONS: Partial<Record<TicketStatus, React.ElementType>> = {
  pendente: Clock,
  aprovado: Check,
  reopen_requested: AlertCircle,
}

const SUB_COLORS: Partial<Record<TicketStatus, string>> = {
  pendente: 'text-muted-foreground',
  aprovado: 'text-success',
  reopen_requested: 'text-warning',
}

export function TicketCard({ ticket }: TicketCardProps) {
  const display = getDisplayStatus(ticket.status)
  const subLabel = OPEN_SUB_LABELS[ticket.status]
  const SubIcon = SUB_ICONS[ticket.status]
  const subColor = SUB_COLORS[ticket.status] ?? 'text-muted-foreground'

  return (
    <Link href={`/app/${ticket.id}`}>
      <Card className={cn(
        'group border-l-[3px] hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer h-full',
        ACCENT_BORDERS[display]
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {ticket.title}
            </h3>
            <TicketStatusBadge status={ticket.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Sub-indicador para status "Aberto" */}
          {display === 'aberto' && subLabel && (
            <div className={cn('flex items-center gap-1.5 text-xs', subColor)}>
              {SubIcon && <SubIcon className="h-3 w-3" />}
              <span>{subLabel}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>{ticket.department}</span>
              </div>
              <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ptBR })}</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
