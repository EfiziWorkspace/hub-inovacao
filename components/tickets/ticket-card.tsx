import Link from 'next/link'
import { TicketStatusBadge } from './ticket-status-badge'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Building2, Check, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import type { TicketStatus, DevSubstatus } from '@/lib/types/enums'
import { OPEN_SUB_LABELS, getDisplayStatus, DISPLAY_STATUS_DOT_COLORS, type DisplayStatus } from '@/lib/constants'
import { cn } from '@/lib/utils'

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
      <div className="group flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:bg-muted/30 hover:border-primary/20 transition-all duration-200 cursor-pointer">
        {/* Status dot */}
        <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', DISPLAY_STATUS_DOT_COLORS[display])} />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {ticket.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {display === 'aberto' && subLabel ? (
              <span className={cn('text-[11px] flex items-center gap-1', subColor)}>
                {SubIcon && <SubIcon className="h-3 w-3" />}
                {subLabel}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {ticket.department}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground/50">·</span>
            <span className="text-[11px] text-muted-foreground/50">
              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        </div>

        {/* Status badge + arrow */}
        <TicketStatusBadge status={ticket.status} />
        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </Link>
  )
}
