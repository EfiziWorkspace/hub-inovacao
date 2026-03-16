import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveTemplates } from '@/actions/templates'
import { NewTicketFlow } from '@/components/tickets/new-ticket-flow'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewTicketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, templates] = await Promise.all([
    supabase
      .from('profiles')
      .select('department')
      .eq('id', user.id)
      .single(),
    getActiveTemplates(),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/app" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold">Nova Ideia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Descreva sua ideia de sistema e envie para avaliacao.
        </p>
      </div>

      <NewTicketFlow
        userId={user.id}
        defaultDepartment={profile?.department ?? undefined}
        templates={templates}
      />
    </div>
  )
}
