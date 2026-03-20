import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function CollaboratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { count: ticketCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, avatar_url, department, role')
      .eq('id', user.id)
      .single(),
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .in('status', ['pendente', 'aprovado', 'reopen_requested']),
  ])

  if (!profile) redirect('/login')

  return (
    <SidebarProvider>
      <AppSidebar
        ticketCount={ticketCount ?? 0}
        user={{
          id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          department: profile.department,
          role: profile.role,
        }}
      />
      <SidebarInset>
        <div className="flex-1 px-6 py-6 lg:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
