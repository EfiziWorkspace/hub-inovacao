'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { reviewTicketSchema, updateDevStatusSchema } from '@/lib/schemas/review'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

async function requireAdmin() {
  const { supabase, user } = await getAuthenticatedUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    throw new Error('Permissão negada.')
  }
  return user
}

export async function reviewTicket(formData: FormData) {
  let user
  try { user = await requireAdmin() } catch { return { error: 'Permissão negada.' } }

  const raw = {
    ticket_id: formData.get('ticket_id') as string,
    action: formData.get('action') as 'aprovado' | 'recusado',
    comment: (formData.get('comment') as string) || undefined,
  }

  const parsed = reviewTicketSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Dados inválidos' }

  const admin = createAdminClient()

  const { data: updated, error } = await admin
    .from('tickets')
    .update({ status: parsed.data.action })
    .eq('id', parsed.data.ticket_id)
    .eq('status', 'pendente')
    .select()
    .single()

  if (error || !updated) {
    return { error: 'Chamado já foi revisado ou não encontrado.' }
  }

  await admin.from('ticket_events').insert({
    ticket_id: parsed.data.ticket_id,
    actor_id: user.id,
    event_type: 'status_changed',
    old_value: 'pendente',
    new_value: parsed.data.action,
    comment: parsed.data.comment ?? null,
  })

  revalidatePath('/admin/fila')
  revalidatePath('/admin')
  return { success: true }
}

export async function updateDevStatus(formData: FormData) {
  let user
  try { user = await requireAdmin() } catch { return { error: 'Permissão negada.' } }

  const raw = {
    ticket_id: formData.get('ticket_id') as string,
    dev_substatus: (formData.get('dev_substatus') as string) || null,
    conclude: formData.get('conclude') === 'true',
    comment: (formData.get('comment') as string) || undefined,
  }

  const parsed = updateDevStatusSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Dados inválidos' }

  const admin = createAdminClient()

  const newStatus = parsed.data.conclude ? 'concluido' : 'em_desenvolvimento'

  const { data: ticket } = await admin
    .from('tickets')
    .select('status, dev_substatus')
    .eq('id', parsed.data.ticket_id)
    .single()

  await admin.from('tickets').update({
    status: newStatus,
    dev_substatus: parsed.data.conclude ? null : parsed.data.dev_substatus,
  }).eq('id', parsed.data.ticket_id)

  const eventType = (parsed.data.conclude || ticket?.status !== newStatus)
    ? 'status_changed'
    : 'substatus_changed'

  await admin.from('ticket_events').insert({
    ticket_id: parsed.data.ticket_id,
    actor_id: user.id,
    event_type: eventType,
    old_value: ticket?.dev_substatus ?? ticket?.status ?? null,
    new_value: parsed.data.conclude ? 'concluido' : parsed.data.dev_substatus,
    comment: parsed.data.comment ?? null,
  })

  revalidatePath('/admin/projetos')
  revalidatePath('/admin')
  return { success: true }
}

export async function reopenTicket(ticketId: string, comment?: string) {
  let user
  try { user = await requireAdmin() } catch { return { error: 'Permissão negada.' } }

  const admin = createAdminClient()

  // Atomic: UPDATE only if status allows reopen
  const { data: updated, error } = await admin
    .from('tickets')
    .update({ status: 'em_desenvolvimento', dev_substatus: null })
    .eq('id', ticketId)
    .in('status', ['concluido', 'recusado', 'reopen_requested'])
    .select('status')
    .single()

  if (error || !updated) {
    return { error: 'Chamado não pode ser reaberto.' }
  }

  await admin.from('ticket_events').insert({
    ticket_id: ticketId,
    actor_id: user.id,
    event_type: 'reopened',
    old_value: updated.status,
    new_value: 'em_desenvolvimento',
    comment: comment ?? null,
  })

  revalidatePath('/admin/projetos')
  revalidatePath('/admin')
  return { success: true }
}

export async function requestReopen(ticketId: string, comment: string, newDocUrls?: string[]) {
  const { user } = await getAuthenticatedUser()

  const admin = createAdminClient()

  // Build update object — replace docs if new ones provided
  const updateData: Record<string, unknown> = { status: 'reopen_requested' }
  if (newDocUrls && newDocUrls.length > 0) {
    updateData.doc_urls = newDocUrls
  }

  // Atomic: UPDATE only if user owns ticket and status allows
  const { data: updated, error } = await admin
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId)
    .eq('author_id', user.id)
    .in('status', ['concluido', 'recusado'])
    .select('status')
    .single()

  if (error || !updated) {
    return { error: 'Chamado não encontrado ou não pode ser reaberto.' }
  }

  await admin.from('ticket_events').insert({
    ticket_id: ticketId,
    actor_id: user.id,
    event_type: 'reopen_requested',
    old_value: updated.status,
    new_value: 'reopen_requested',
    comment,
  })

  revalidatePath('/app')
  revalidatePath('/admin/fila')
  revalidatePath('/admin')
  return { success: true }
}
