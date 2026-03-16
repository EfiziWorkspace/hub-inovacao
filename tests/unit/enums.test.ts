import { describe, it, expect } from 'vitest'
import type {
  TicketStatus,
  DevSubstatus,
  UserRole,
  EventType,
  MentoringStatus,
  BadgeType,
  TemplateField,
} from '@/lib/types/enums'

describe('TicketStatus type', () => {
  it('accepts all valid statuses', () => {
    const statuses: TicketStatus[] = [
      'pendente', 'aprovado', 'recusado', 'em_desenvolvimento', 'concluido', 'reopen_requested',
    ]
    expect(statuses).toHaveLength(6)
  })
})

describe('DevSubstatus type', () => {
  it('accepts all valid substatuses', () => {
    const subs: DevSubstatus[] = ['banco_de_dados', 'integracao', 'subindo_servidor', 'em_teste']
    expect(subs).toHaveLength(4)
  })
})

describe('UserRole type', () => {
  it('accepts collaborator and admin', () => {
    const roles: UserRole[] = ['collaborator', 'admin']
    expect(roles).toHaveLength(2)
  })
})

describe('EventType type', () => {
  it('accepts all event types including reopen', () => {
    const events: EventType[] = [
      'created', 'status_changed', 'substatus_changed',
      'observation_added', 'reopen_requested', 'reopened',
    ]
    expect(events).toHaveLength(6)
  })
})

describe('MentoringStatus type', () => {
  it('accepts all mentoring statuses', () => {
    const statuses: MentoringStatus[] = ['agendada', 'concluida', 'cancelada']
    expect(statuses).toHaveLength(3)
  })
})

describe('BadgeType type', () => {
  it('accepts all badge types', () => {
    const badges: BadgeType[] = [
      'primeira_ideia', 'cinco_ideias', 'ideia_aprovada',
      'tres_aprovadas', 'ideia_concluida', 'participou_mentoria',
    ]
    expect(badges).toHaveLength(6)
  })
})

describe('TemplateField interface', () => {
  it('validates template field structure', () => {
    const field: TemplateField = {
      label: 'Nome do sistema',
      placeholder: 'Ex: Sistema de RH',
      required: true,
    }
    expect(field.label).toBeTruthy()
    expect(typeof field.required).toBe('boolean')
  })
})
