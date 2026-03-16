'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createTicketSchema } from '@/lib/schemas/ticket'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getSignedUrl(path: string, expiresIn = 300) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // Verificar se o path pertence ao usuário ou se é admin
  const pathUserId = path.split('/')[0]
  if (pathUserId !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return { error: 'Acesso negado.' }
    }
  }

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from('ticket-files')
    .createSignedUrl(path, expiresIn)
  if (error || !data?.signedUrl) return { error: 'Não foi possível gerar o link.' }
  return { url: data.signedUrl }
}

export async function createTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('department')
    .eq('id', user.id)
    .single()

  const templateId = (formData.get('template_id') as string) || null

  let templateResponses = null
  try {
    const rawResponses = formData.get('template_responses') as string
    if (rawResponses) templateResponses = JSON.parse(rawResponses)
  } catch {
    return { error: { _global: ['Dados do template inválidos.'] } }
  }

  let docUrls: string[] = []
  try {
    docUrls = JSON.parse((formData.get('doc_urls') as string) || '[]')
  } catch {
    docUrls = []
  }

  const raw = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    department: profile?.department ?? (formData.get('department') as string),
    doc_urls: docUrls,
    prototype_url: (formData.get('prototype_url') as string) || null,
  }

  const parsed = createTicketSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const admin = createAdminClient()

  const { data: ticket, error } = await admin
    .from('tickets')
    .insert({
      author_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      department: parsed.data.department,
      doc_urls: parsed.data.doc_urls,
      prototype_url: parsed.data.prototype_url,
      template_id: templateId,
      template_responses: templateResponses,
    })
    .select('id')
    .single()

  if (error || !ticket) {
    return { error: { _global: ['Erro ao criar chamado. Tente novamente.'] } }
  }

  await admin.from('ticket_events').insert({
    ticket_id: ticket.id,
    actor_id: user.id,
    event_type: 'created',
    new_value: 'pendente',
  })

  revalidatePath('/app')
  redirect(`/app/${ticket.id}`)
}

/** Busca notificações recentes para o usuário */
export async function getNotifications(role: 'admin' | 'collaborator', userId: string) {
  const admin = createAdminClient()

  let query = admin
    .from('ticket_events')
    .select('id, ticket_id, event_type, new_value, comment, created_at, tickets(title, author_id), profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(15)

  if (role === 'admin') {
    query = query.neq('actor_id', userId)
  } else {
    // For collaborator: only events on their tickets
    const { data: userTickets } = await admin
      .from('tickets')
      .select('id')
      .eq('author_id', userId)
    const ticketIds = (userTickets ?? []).map(t => t.id)
    if (ticketIds.length === 0) return []
    query = query.in('ticket_id', ticketIds).neq('actor_id', userId)
  }

  const { data } = await query

  return (data ?? [])
    .filter((e: any) => e.tickets)
    .map((e: any) => ({
      id: e.id,
      ticket_id: e.ticket_id,
      event_type: e.event_type,
      new_value: e.new_value,
      comment: e.comment,
      created_at: e.created_at,
      ticket_title: e.tickets?.title ?? 'Chamado',
      actor_name: e.profiles?.full_name ?? 'Usuário',
    }))
}

/** Busca eventos de um ticket usando service_role (bypassa RLS) */
export async function getTicketEvents(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { events: [] }

  const admin = createAdminClient()

  const { data: events } = await admin
    .from('ticket_events')
    .select('id, event_type, old_value, new_value, comment, created_at, profiles(full_name)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  return { events: events ?? [] }
}
