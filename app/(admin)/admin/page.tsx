import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDisplayStatus, type DisplayStatus } from '@/lib/constants'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import type { TicketStatus } from '@/lib/types/enums'
import { startOfWeek, subWeeks, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TicketRow {
  id: string
  title: string
  department: string
  status: string
  updated_at: string
  created_at: string
  profiles: { full_name: string; avatar_url?: string | null } | null
  user_id: string
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const adminName = profile?.full_name?.split(' ')[0] ?? 'Admin'

  const admin = createAdminClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const eightWeeksAgo = startOfWeek(subWeeks(new Date(), 7), { weekStartsOn: 1 }).toISOString()

  const [
    { data: allTickets },
    { data: stalledTickets },
    { data: recentEvents },
    { count: newThisWeek },
    { data: pendingTickets },
  ] = await Promise.all([
    admin.from('tickets')
      .select('id, title, department, status, updated_at, created_at, user_id, profiles(full_name, avatar_url)'),
    admin.from('tickets')
      .select('id, title, status, department, updated_at, profiles(full_name)')
      .not('status', 'in', '("concluido","recusado")')
      .lt('updated_at', sevenDaysAgo)
      .order('updated_at', { ascending: true })
      .limit(10),
    admin.from('ticket_events')
      .select('id, ticket_id, event_type, old_value, new_value, comment, created_at, profiles(full_name, avatar_url), tickets(id, title, status, department, description)')
      .order('created_at', { ascending: false })
      .limit(8),
    admin.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    admin.from('tickets')
      .select('id, title, department, status, created_at, profiles(full_name, avatar_url)')
      .eq('status', 'pendente')
      .order('created_at', { ascending: true })
      .limit(5),
  ])

  const tickets = (allTickets ?? []) as unknown as TicketRow[]

  // Group by display status
  const ticketsByDisplay: Record<DisplayStatus, Array<{
    id: string; title: string; department: string; status: string;
    updated_at: string; profiles: { full_name: string } | null
  }>> = {
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

  // Status pills
  const pills: Array<{ display: DisplayStatus; count: number; trend?: number }> = [
    { display: 'aberto', count: ticketsByDisplay.aberto.length, trend: newThisWeek ?? 0 },
    { display: 'em_andamento', count: ticketsByDisplay.em_andamento.length },
    { display: 'concluido', count: ticketsByDisplay.concluido.length },
    { display: 'recusado', count: ticketsByDisplay.recusado.length },
  ]

  // Tickets per week (last 8 weeks)
  const weeklyData: Array<{ week: string; count: number }> = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 })
    const weekEnd = startOfWeek(subWeeks(new Date(), i - 1), { weekStartsOn: 1 })
    const weekLabel = format(weekStart, "dd MMM", { locale: ptBR })
    const count = tickets.filter((t) => {
      const created = new Date(t.created_at)
      return created >= weekStart && created < weekEnd
    }).length
    weeklyData.push({ week: weekLabel, count })
  }

  // Typed events
  const typedEvents = (recentEvents ?? []) as unknown as Array<{
    id: string
    ticket_id: string
    event_type: import('@/lib/types/enums').EventType
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

  const typedPending = (pendingTickets ?? []) as unknown as Array<{
    id: string
    title: string
    department: string
    status: string
    created_at: string
    profiles: { full_name: string; avatar_url: string | null } | null
  }>

  return (
    <AdminDashboard
      adminName={adminName}
      totalTickets={tickets.length}
      pills={pills}
      ticketsByStatus={ticketsByDisplay}
      departmentData={byDept}
      weeklyData={weeklyData}
      pendingTickets={typedPending}
      events={typedEvents}
      stalledTickets={typedStalled}
    />
  )
}
