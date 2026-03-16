import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { MentoringView } from '@/components/mentoring/mentoring-view'

export default async function CollaboratorMentoringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [{ data: availableSlots }, { data: mySessions }] = await Promise.all([
    admin
      .from('admin_availability')
      .select('*, profiles!admin_availability_admin_id_fkey(full_name, avatar_url)')
      .eq('is_booked', false)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true }),
    admin
      .from('mentoring_sessions')
      .select('*, profiles!mentoring_sessions_admin_id_fkey(full_name, avatar_url)')
      .eq('collaborator_id', user.id)
      .order('scheduled_date', { ascending: false }),
  ])

  return (
    <MentoringView
      availableSlots={(availableSlots ?? []) as any[]}
      mySessions={(mySessions ?? []) as any[]}
    />
  )
}
