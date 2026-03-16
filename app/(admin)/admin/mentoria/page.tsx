import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { MentoringDashboard } from '@/components/mentoring/mentoring-dashboard'

export default async function AdminMentoringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [{ data: slots }, { data: sessions }] = await Promise.all([
    admin
      .from('admin_availability')
      .select('*')
      .eq('admin_id', user.id)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true }),
    admin
      .from('mentoring_sessions')
      .select('*, profiles!mentoring_sessions_collaborator_id_fkey(full_name, email, avatar_url, department)')
      .order('scheduled_date', { ascending: false })
      .order('scheduled_start', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mentoria"
        description="Gerencie horários e acompanhe sessões de mentoria"
        gradient="info"
      />
      <MentoringDashboard
        slots={(slots ?? []) as any[]}
        sessions={(sessions ?? []) as any[]}
      />
    </div>
  )
}
