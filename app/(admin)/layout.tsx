import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [{ data: profile }, { count: pendingCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, avatar_url, role, department')
      .eq('id', user.id)
      .single(),
    admin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pendente', 'reopen_requested']),
  ])

  if (!profile || profile.role !== 'admin') redirect('/app')

  return (
    <SidebarProvider>
      <AdminSidebar
        pendingCount={pendingCount ?? 0}
        user={{
          id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          role: profile.role,
          department: profile.department,
        }}
      />
      <SidebarInset>
        <div className="flex-1 px-6 py-6 lg:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
