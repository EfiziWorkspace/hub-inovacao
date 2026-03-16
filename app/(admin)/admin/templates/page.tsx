import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/page-header'
import { TemplateManager } from '@/components/templates/template-manager'

export default async function AdminTemplatesPage() {
  const admin = createAdminClient()

  const { data: templates } = await admin
    .from('idea_templates')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader title="Templates" description="Gerencie templates para submissão de ideias" gradient="info" />
      <TemplateManager templates={(templates ?? []) as any[]} />
    </div>
  )
}
