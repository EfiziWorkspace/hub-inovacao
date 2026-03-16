import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TicketList } from '@/components/tickets/ticket-list'
import type { TicketStatus, DevSubstatus } from '@/lib/types/enums'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: tickets }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase
      .from('tickets')
      .select('id, title, department, status, dev_substatus, created_at, updated_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // Fetch recent event separately to avoid type issues
  const { data: recentEvents } = await supabase
    .from('ticket_events')
    .select('id, ticket_id, event_type, new_value, created_at, tickets(title)')
    .in('event_type', ['status_changed', 'reopened', 'reopen_requested'])
    .neq('actor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const recentEvent = recentEvents?.[0] as {
    id: string
    ticket_id: string
    event_type: string
    new_value: string | null
    created_at: string
    tickets: { title: string } | null
  } | undefined

  const typedTickets = (tickets ?? []) as Array<{
    id: string
    title: string
    department: string
    status: TicketStatus
    dev_substatus: DevSubstatus | null
    created_at: string
    updated_at: string
  }>

  // Only show highlight if it happened in the last 48h
  const highlight = recentEvent
    ? (() => {
        const eventAge = Date.now() - new Date(recentEvent.created_at).getTime()
        if (eventAge > 48 * 60 * 60 * 1000) return undefined
        return {
          ticketId: recentEvent.ticket_id,
          ticketTitle: recentEvent.tickets?.title ?? 'Chamado',
          eventType: recentEvent.event_type,
          newValue: recentEvent.new_value,
        }
      })()
    : undefined

  return (
    <TicketList
      tickets={typedTickets}
      userName={profile?.full_name ?? 'Colaborador'}
      recentHighlight={highlight}
    />
  )
}
