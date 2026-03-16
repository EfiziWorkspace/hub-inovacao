import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/page-header'
import { QueueView } from '@/components/admin/queue-view'
import { ClipboardList, Sparkles } from 'lucide-react'

export default async function AdminQueuePage() {
  const admin = createAdminClient()

  const { data: rawTickets } = await admin
    .from('tickets')
    .select('id, title, description, department, status, created_at, doc_urls, prototype_url, profiles(full_name, email, avatar_url, department)')
    .in('status', ['pendente', 'reopen_requested'])
    .order('created_at', { ascending: false })

  const tickets = (rawTickets ?? []) as any[]

  const newCount = tickets.filter(
    (t) => Date.now() - new Date(t.created_at).getTime() < 24 * 60 * 60 * 1000
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fila de Revisão"
        description={`${tickets.length} chamado(s) aguardando revisão${newCount > 0 ? ` · ${newCount} novo(s) hoje` : ''}`}
        gradient="warning"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
      </PageHeader>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mb-4">
            <Sparkles className="h-8 w-8 text-success" />
          </div>
          <p className="font-semibold text-lg">Tudo em dia!</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Nenhum chamado aguardando revisão. Hora de tomar um café.
          </p>
        </div>
      ) : (
        <QueueView tickets={tickets} />
      )}
    </div>
  )
}
