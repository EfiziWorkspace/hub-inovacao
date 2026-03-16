import { PageHeader } from '@/components/layout/page-header'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatsCards } from '@/components/admin/stats-cards'
import { ActivityFeed } from '@/components/admin/activity-feed'
import { StalledTickets } from '@/components/admin/stalled-tickets'
import { DepartmentChart } from '@/components/admin/department-chart'
import { getDisplayStatus, type DisplayStatus } from '@/lib/constants'
import type { EventType, TicketStatus } from '@/lib/types/enums'

interface TicketRow {
  id: string
  title: string
  department: string
  status: string
  updated_at: string
  created_at: string
  profiles: { full_name: string } | null
}

export default async function AdminDashboardPage() {
  const admin = createAdminClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: allTickets },
    { data: stalledTickets },
    { data: recentEvents },
    { count: newThisWeek },
  ] = await Promise.all([
    admin.from('tickets')
      .select('id, title, department, status, updated_at, created_at, profiles(full_name)'),
    admin.from('tickets')
      .select('id, title, status, department, updated_at, profiles(full_name)')
      .not('status', 'in', '("concluido","recusado")')
      .lt('updated_at', sevenDaysAgo)
      .order('updated_at', { ascending: true })
      .limit(10),
    admin.from('ticket_events')
      .select('id, ticket_id, event_type, old_value, new_value, comment, created_at, profiles(full_name, avatar_url), tickets(id, title, status, department, description)')
      .order('created_at', { ascending: false })
      .limit(10),
    admin.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
  ])

  const tickets = (allTickets ?? []) as unknown as TicketRow[]

  // Group by display status
  const ticketsByDisplay: Record<DisplayStatus, Array<{ id: string; title: string; department: string; status: string; updated_at: string; profiles: { full_name: string } | null }>> = {
    aberto: [],
    em_andamento: [],
    concluido: [],
    recusado: [],
  }

  for (const t of tickets) {
    const display = getDisplayStatus(t.status as TicketStatus)
    ticketsByDisplay[display].push(t)
  }

  // Department chart data
  const byDept = Object.entries(
    tickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.department] = (acc[t.department] ?? 0) + 1
      return acc
    }, {})
  )
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count)

  const pills: Array<{ display: DisplayStatus; count: number; trend?: number }> = [
    { display: 'aberto', count: ticketsByDisplay.aberto.length, trend: newThisWeek ?? 0 },
    { display: 'em_andamento', count: ticketsByDisplay.em_andamento.length },
    { display: 'concluido', count: ticketsByDisplay.concluido.length },
    { display: 'recusado', count: ticketsByDisplay.recusado.length },
  ]

  const typedEvents = (recentEvents ?? []) as unknown as Array<{
    id: string
    ticket_id: string
    event_type: EventType
    old_value: string | null
    new_value: string | null
    comment: string | null
    created_at: string
    profiles: { full_name: string; avatar_url: string | null } | null
    tickets: { id: string; title: string; status: string; department: string; description: string } | null
  }>

  const typedStalled = (stalledTickets ?? []) as unknown as Array<{
    id: string
    title: string
    status: string
    department: string
    updated_at: string
    profiles: { full_name: string } | null
  }>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Visão geral do Painel de Inovação · ${tickets.length} chamados no total`}
      />

      {/* Status pills */}
      <StatsCards
        pills={pills}
        ticketsByStatus={ticketsByDisplay}
        isAdmin
      />

      {/* Gráfico + Atividade */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DepartmentChart data={byDept} />
        <ActivityFeed events={typedEvents} />
      </div>

      {/* Chamados parados */}
      <StalledTickets tickets={typedStalled} />
    </div>
  )
}
