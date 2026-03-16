import { describe, it, expect } from 'vitest'
import type { Database } from '@/lib/types/database'

describe('Database types', () => {
  it('has all required tables', () => {
    // This test verifies the type structure at compile time
    type Tables = Database['public']['Tables']
    type TableNames = keyof Tables

    // These assertions verify the types exist
    const tables: TableNames[] = [
      'profiles',
      'tickets',
      'ticket_events',
      'idea_templates',
      'admin_availability',
      'mentoring_sessions',
    ]
    expect(tables).toHaveLength(6)
  })

  it('tickets table has template columns', () => {
    type TicketRow = Database['public']['Tables']['tickets']['Row']

    // Type-level check: these fields must exist
    const mockTicket: Partial<TicketRow> = {
      template_id: null,
      template_responses: null,
    }
    expect(mockTicket).toHaveProperty('template_id')
    expect(mockTicket).toHaveProperty('template_responses')
  })

  it('idea_templates has fields_json', () => {
    type TemplateRow = Database['public']['Tables']['idea_templates']['Row']

    const mockTemplate: Partial<TemplateRow> = {
      fields_json: [{ label: 'Test', placeholder: 'test', required: true }],
    }
    expect(mockTemplate.fields_json).toHaveLength(1)
  })

  it('mentoring_sessions has correct status type', () => {
    type SessionRow = Database['public']['Tables']['mentoring_sessions']['Row']

    const mockSession: Partial<SessionRow> = {
      status: 'agendada',
      topic: 'IA generativa',
    }
    expect(mockSession.status).toBe('agendada')
  })
})
