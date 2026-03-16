import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/page-header'
import { ProjectsList } from '@/components/admin/projects-list'
import type { TicketStatus, DevSubstatus } from '@/lib/types/enums'

export default async function AdminProjectsPage() {
  const admin = createAdminClient()

  const { data: rawProjects } = await admin
    .from('tickets')
    .select('id, title, description, department, status, dev_substatus, updated_at, profiles(full_name)')
    .neq('status', 'pendente')
    .order('updated_at', { ascending: false })

  const projects = (rawProjects ?? []) as unknown as Array<{
    id: string
    title: string
    description: string
    department: string
    status: string
    dev_substatus: string | null
    updated_at: string
    profiles: { full_name: string } | null
  }>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos"
        description="Todos os chamados aprovados, em andamento e encerrados"
        gradient="info"
      />

      <ProjectsList projects={projects} />
    </div>
  )
}
