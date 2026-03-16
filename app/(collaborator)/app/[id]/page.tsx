import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge'
import { StatusProgress } from '@/components/tickets/status-progress'
import { TicketTimeline } from '@/components/tickets/ticket-timeline'
import { FileDownloadList } from '@/components/tickets/file-download-list'
import { RequestReopenButton } from '@/components/tickets/request-reopen-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Calendar, Building2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { TicketStatus, DevSubstatus, EventType } from '@/lib/types/enums'

interface TicketRow {
  id: string
  title: string
  description: string
  department: string
  status: string
  dev_substatus: string | null
  doc_urls: string[] | null
  prototype_url: string | null
  created_at: string
  updated_at: string
  author_id: string
}

interface EventRow {
  id: string
  event_type: EventType
  old_value: string | null
  new_value: string | null
  comment: string | null
  created_at: string
  profiles: { full_name: string } | null
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawTicket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .eq('author_id', user.id)
    .single()

  if (!rawTicket) notFound()

  const ticket = rawTicket as TicketRow

  const { data: rawEvents } = await supabase
    .from('ticket_events')
    .select('id, event_type, old_value, new_value, comment, created_at, profiles(full_name)')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  const events = (rawEvents ?? []) as unknown as EventRow[]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Meus Chamados
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold leading-tight">{ticket.title}</h1>
          <TicketStatusBadge status={ticket.status as TicketStatus} />
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(ticket.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            {ticket.department}
          </div>
        </div>

        {/* Progress visual */}
        <StatusProgress status={ticket.status as TicketStatus} />
      </div>

      {/* Descrição */}
      <Card>
        <CardHeader><CardTitle className="text-base">Descrição</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      {/* Arquivos com download */}
      {((ticket.doc_urls?.length ?? 0) > 0 || ticket.prototype_url) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Arquivos</CardTitle></CardHeader>
          <CardContent>
            <FileDownloadList
              docUrls={ticket.doc_urls ?? []}
              prototypeUrl={ticket.prototype_url}
            />
          </CardContent>
        </Card>
      )}

      {/* Reopen */}
      {(ticket.status === 'concluido' || ticket.status === 'recusado') && (
        <Card className="border-dashed">
          <CardContent className="pt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Precisa reabrir este chamado?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sua solicitação será enviada para o admin avaliar.
              </p>
            </div>
            <RequestReopenButton ticketId={ticket.id} />
          </CardContent>
        </Card>
      )}

      {ticket.status === 'reopen_requested' && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <div>
              <p className="text-sm font-medium text-warning">Reabertura solicitada</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aguardando aprovação do admin.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <TicketTimeline events={events} />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
