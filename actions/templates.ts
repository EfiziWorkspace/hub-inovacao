'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const templateFieldSchema = z.object({
  label: z.string().min(1),
  placeholder: z.string(),
  required: z.boolean(),
})

const createTemplateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  description: z.string().max(500).optional(),
  fields_json: z.array(templateFieldSchema).min(1, 'Adicione pelo menos um campo'),
})

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Permissão negada.')
  return user
}

export async function createTemplate(formData: FormData) {
  let user
  try { user = await requireAdmin() } catch { return { error: 'Permissão negada.' } }

  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    fields_json: JSON.parse(formData.get('fields_json') as string || '[]'),
  }

  const parsed = createTemplateSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Dados inválidos' }

  const admin = createAdminClient()

  const { error } = await admin.from('idea_templates').insert({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    fields_json: parsed.data.fields_json,
    created_by: user.id,
  })

  if (error) return { error: 'Erro ao criar template.' }

  revalidatePath('/admin/templates')
  return { success: true }
}

export async function updateTemplate(formData: FormData) {
  try { await requireAdmin() } catch { return { error: 'Permissão negada.' } }

  const id = formData.get('id') as string
  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    fields_json: JSON.parse(formData.get('fields_json') as string || '[]'),
  }

  const parsed = createTemplateSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Dados inválidos' }

  const admin = createAdminClient()

  const { error } = await admin.from('idea_templates').update({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    fields_json: parsed.data.fields_json,
  }).eq('id', id)

  if (error) return { error: 'Erro ao atualizar template.' }

  revalidatePath('/admin/templates')
  return { success: true }
}

export async function toggleTemplateActive(templateId: string) {
  try { await requireAdmin() } catch { return { error: 'Permissão negada.' } }

  const admin = createAdminClient()

  const { data: template } = await admin
    .from('idea_templates')
    .select('is_active')
    .eq('id', templateId)
    .single()

  if (!template) return { error: 'Template não encontrado.' }

  await admin.from('idea_templates').update({
    is_active: !template.is_active,
  }).eq('id', templateId)

  revalidatePath('/admin/templates')
  return { success: true }
}

export async function deleteTemplate(templateId: string) {
  try { await requireAdmin() } catch { return { error: 'Permissão negada.' } }

  const admin = createAdminClient()

  // Check if any tickets use this template
  const { count } = await admin
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', templateId)

  if (count && count > 0) {
    return { error: `Este template está sendo usado por ${count} chamado(s). Desative-o em vez de excluir.` }
  }

  const { error } = await admin.from('idea_templates').delete().eq('id', templateId)
  if (error) return { error: 'Erro ao excluir template.' }

  revalidatePath('/admin/templates')
  return { success: true }
}

export async function getActiveTemplates() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('idea_templates')
    .select('id, name, description, fields_json')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return data ?? []
}
