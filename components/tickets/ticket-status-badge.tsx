import { Badge } from '@/components/ui/badge'
import {
  DISPLAY_STATUS_LABELS,
  DISPLAY_STATUS_COLORS,
  DEV_SUBSTATUS_LABELS,
  getDisplayStatus,
} from '@/lib/constants'
import type { TicketStatus, DevSubstatus } from '@/lib/types/enums'
import type { DisplayStatus } from '@/lib/constants'
import { cn } from '@/lib/utils'

/** Badge simplificado: Aberto, Em Andamento, Concluido, Recusado */
export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const display = getDisplayStatus(status)
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', DISPLAY_STATUS_COLORS[display])}
    >
      {DISPLAY_STATUS_LABELS[display]}
    </Badge>
  )
}

export function DevSubstatusBadge({ substatus }: { substatus: DevSubstatus }) {
  return (
    <Badge variant="outline" className="bg-info/15 text-info border-info/30 font-medium">
      {DEV_SUBSTATUS_LABELS[substatus]}
    </Badge>
  )
}
