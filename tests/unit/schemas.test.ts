import { describe, it, expect } from 'vitest'
import { createTicketSchema } from '@/lib/schemas/ticket'
import { reviewTicketSchema, updateDevStatusSchema } from '@/lib/schemas/review'

describe('createTicketSchema', () => {
  it('validates a correct ticket', () => {
    const result = createTicketSchema.safeParse({
      title: 'Sistema de automação',
      description: 'Um sistema para automatizar processos internos da empresa',
      department: 'Tecnologia',
      doc_urls: [],
      prototype_url: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects short title', () => {
    const result = createTicketSchema.safeParse({
      title: 'abc',
      description: 'Uma descrição válida com mais de vinte caracteres',
      department: 'Tecnologia',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short description', () => {
    const result = createTicketSchema.safeParse({
      title: 'Título válido',
      description: 'Curta',
      department: 'Tecnologia',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid department', () => {
    const result = createTicketSchema.safeParse({
      title: 'Título válido para teste',
      description: 'Uma descrição com mais de vinte caracteres válidos',
      department: 'Setor Inexistente',
    })
    expect(result.success).toBe(false)
  })

  it('defaults doc_urls to empty array', () => {
    const result = createTicketSchema.safeParse({
      title: 'Título válido para teste',
      description: 'Uma descrição com mais de vinte caracteres válidos',
      department: 'Tecnologia',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.doc_urls).toEqual([])
    }
  })
})

describe('reviewTicketSchema', () => {
  it('validates approve action', () => {
    const result = reviewTicketSchema.safeParse({
      ticket_id: '550e8400-e29b-41d4-a716-446655440000',
      action: 'aprovado',
    })
    expect(result.success).toBe(true)
  })

  it('validates reject action with comment', () => {
    const result = reviewTicketSchema.safeParse({
      ticket_id: '550e8400-e29b-41d4-a716-446655440000',
      action: 'recusado',
      comment: 'Não está no escopo atual.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid action', () => {
    const result = reviewTicketSchema.safeParse({
      ticket_id: '550e8400-e29b-41d4-a716-446655440000',
      action: 'invalido',
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-uuid ticket_id', () => {
    const result = reviewTicketSchema.safeParse({
      ticket_id: 'not-a-uuid',
      action: 'aprovado',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateDevStatusSchema', () => {
  it('validates substatus update', () => {
    const result = updateDevStatusSchema.safeParse({
      ticket_id: '550e8400-e29b-41d4-a716-446655440000',
      dev_substatus: 'banco_de_dados',
      conclude: false,
    })
    expect(result.success).toBe(true)
  })

  it('validates conclude', () => {
    const result = updateDevStatusSchema.safeParse({
      ticket_id: '550e8400-e29b-41d4-a716-446655440000',
      dev_substatus: null,
      conclude: true,
      comment: 'Projeto finalizado com sucesso.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid substatus', () => {
    const result = updateDevStatusSchema.safeParse({
      ticket_id: '550e8400-e29b-41d4-a716-446655440000',
      dev_substatus: 'invalido',
    })
    expect(result.success).toBe(false)
  })
})
