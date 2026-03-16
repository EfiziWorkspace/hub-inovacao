import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { TicketStatusBadge, DevSubstatusBadge } from '@/components/tickets/ticket-status-badge'
import { TicketTimeline } from '@/components/tickets/ticket-timeline'
import { DevStatusSelect } from '@/components/admin/dev-status-select'
import { ReopenButton } from '@/components/admin/reopen-button'
import { StatusProgress } from '@/components/tickets/status-progress'
import { FileDownloadList } from '@/components/tickets/file-download-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { ChevronLeft, Calendar, Building2, Mail } from 'lucide-react'
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
  doc_urls: string[]
  prototype_url: string | null
  created_at: string
  updated_at: string
  author_id: string
  profiles: { full_name: string; email: string; department: string | null } | null
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

export default async function AdminProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: rawTicket } = await admin
    .from('tickets')
    .select('*, profiles(full_name, email, department)')
    .eq('id', id)
    .single()

  if (!rawTicket) notFound()

  const ticket = rawTicket as unknown as TicketRow

  const { data: rawEvents } = await admin
    .from('ticket_events')
    .select('id, event_type, old_value, new_value, comment, created_at, profiles(full_name)')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  const events = (rawEvents ?? []) as unknown as EventRow[]

  const initials = ticket.profiles?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/admin/projetos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Projetos
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold leading-tight">{ticket.title}</h1>
          <TicketStatusBadge status={ticket.status as TicketStatus} />
        </div>

        {/* Author card */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border/60 p-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{ticket.profiles?.full_name ?? '—'}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {ticket.profiles?.email ?? '—'}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {ticket.department}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(ticket.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>

        {/* Progress */}
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

      {ticket.status !== 'concluido' && ticket.status !== 'recusado' && ticket.status !== 'reopen_requested' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Atualizar Desenvolvimento</CardTitle></CardHeader>
          <CardContent>
            <DevStatusSelect
              ticketId={ticket.id}
              currentSubstatus={ticket.dev_substatus as DevSubstatus | null}
            />
          </CardContent>
        </Card>
      )}

      {(ticket.status === 'concluido' || ticket.status === 'recusado') && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Reabrir este chamado?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Voltará para &quot;Em Desenvolvimento&quot; e o colaborador será notificado.
              </p>
            </div>
            <ReopenButton ticketId={ticket.id} />
          </CardContent>
        </Card>
      )}

      {ticket.status === 'reopen_requested' && (
        <Card className="border-warning/30">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warning">Reabertura solicitada pelo colaborador</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aprove para reabrir o chamado.
              </p>
            </div>
            <ReopenButton ticketId={ticket.id} />
          </CardContent>
        </Card>
      )}

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
