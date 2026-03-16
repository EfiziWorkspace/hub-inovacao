'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Permissão negada.')
  return user
}

export async function createAvailabilitySlots(formData: FormData) {
  let user
  try { user = await requireAdmin() } catch { return { error: 'Permissão negada.' } }

  const date = formData.get('date') as string
  const slots = JSON.parse(formData.get('slots') as string || '[]') as string[]

  if (!date || slots.length === 0) return { error: 'Selecione data e horários.' }

  const admin = createAdminClient()

  const inserts = slots.map((startTime) => {
    const [h, m] = startTime.split(':').map(Number)
    const endH = h + 1
    return {
      admin_id: user.id,
      date,
      start_time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`,
      end_time: `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`,
    }
  })

  const { error } = await admin.from('admin_availability').insert(inserts)

  if (error) {
    if (error.code === '23505') return { error: 'Alguns horários já estão cadastrados.' }
    return { error: 'Erro ao criar horários.' }
  }

  revalidatePath('/admin/mentoria')
  return { success: true }
}

export async function deleteAvailabilitySlot(slotId: string) {
  try { await requireAdmin() } catch { return { error: 'Permissão negada.' } }

  const admin = createAdminClient()

  const { data: slot } = await admin
    .from('admin_availability')
    .select('is_booked')
    .eq('id', slotId)
    .single()

  if (!slot) return { error: 'Horário não encontrado.' }
  if (slot.is_booked) return { error: 'Horário já foi agendado. Cancele a sessão primeiro.' }

  await admin.from('admin_availability').delete().eq('id', slotId)

  revalidatePath('/admin/mentoria')
  return { success: true }
}

export async function bookMentoringSession(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const availabilityId = formData.get('availability_id') as string
  const topic = formData.get('topic') as string
  const notes = (formData.get('notes') as string) || null

  if (!availabilityId || !topic) return { error: 'Preencha o tema da mentoria.' }

  const admin = createAdminClient()

  // Atomic: mark slot as booked only if not already booked
  const { data: slot, error: slotError } = await admin
    .from('admin_availability')
    .update({ is_booked: true })
    .eq('id', availabilityId)
    .eq('is_booked', false)
    .select('admin_id, date, start_time, end_time')
    .single()

  if (slotError || !slot) {
    return { error: 'Este horário já foi reservado. Escolha outro.' }
  }

  const { error } = await admin.from('mentoring_sessions').insert({
    admin_id: slot.admin_id,
    collaborator_id: user.id,
    availability_id: availabilityId,
    scheduled_date: slot.date,
    scheduled_start: slot.start_time,
    scheduled_end: slot.end_time,
    topic,
    notes,
  })

  if (error) {
    // Rollback the slot
    await admin.from('admin_availability').update({ is_booked: false }).eq('id', availabilityId)
    return { error: 'Erro ao agendar. Tente novamente.' }
  }

  revalidatePath('/app/mentoria')
  revalidatePath('/admin/mentoria')
  return { success: true }
}

export async function updateSessionStatus(sessionId: string, status: 'concluida' | 'cancelada') {
  try { await requireAdmin() } catch { return { error: 'Permissão negada.' } }

  const admin = createAdminClient()

  const { data: session } = await admin
    .from('mentoring_sessions')
    .select('availability_id, status')
    .eq('id', sessionId)
    .single()

  if (!session) return { error: 'Sessão não encontrada.' }
  if (session.status !== 'agendada') return { error: 'Sessão já foi finalizada.' }

  await admin.from('mentoring_sessions').update({ status }).eq('id', sessionId)

  // If canceled, free the slot
  if (status === 'cancelada') {
    await admin.from('admin_availability').update({ is_booked: false }).eq('id', session.availability_id)
  }

  revalidatePath('/admin/mentoria')
  revalidatePath('/app/mentoria')
  return { success: true }
}
