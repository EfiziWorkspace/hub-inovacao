import { describe, it, expect } from 'vitest'
import {
  getDisplayStatus,
  DISPLAY_STATUS_LABELS,
  DISPLAY_STATUS_COLORS,
  DISPLAY_STATUS_DOT_COLORS,
  OPEN_SUB_LABELS,
  TICKET_STATUS_LABELS,
  DEV_SUBSTATUS_LABELS,
  DEPARTMENTS,
  APP_ROUTES,
} from '@/lib/constants'
import type { TicketStatus } from '@/lib/types/enums'

describe('getDisplayStatus', () => {
  it('maps pendente to aberto', () => {
    expect(getDisplayStatus('pendente')).toBe('aberto')
  })

  it('maps aprovado to aberto', () => {
    expect(getDisplayStatus('aprovado')).toBe('aberto')
  })

  it('maps reopen_requested to aberto', () => {
    expect(getDisplayStatus('reopen_requested')).toBe('aberto')
  })

  it('maps em_desenvolvimento to em_andamento', () => {
    expect(getDisplayStatus('em_desenvolvimento')).toBe('em_andamento')
  })

  it('maps concluido to concluido', () => {
    expect(getDisplayStatus('concluido')).toBe('concluido')
  })

  it('maps recusado to recusado', () => {
    expect(getDisplayStatus('recusado')).toBe('recusado')
  })
})

describe('DISPLAY_STATUS_LABELS', () => {
  it('has labels for all display statuses', () => {
    expect(DISPLAY_STATUS_LABELS.aberto).toBe('Aberto')
    expect(DISPLAY_STATUS_LABELS.em_andamento).toBe('Em Andamento')
    expect(DISPLAY_STATUS_LABELS.concluido).toBe('Concluído')
    expect(DISPLAY_STATUS_LABELS.recusado).toBe('Recusado')
  })
})

describe('DISPLAY_STATUS_COLORS', () => {
  it('has color classes for all display statuses', () => {
    const statuses = ['aberto', 'em_andamento', 'concluido', 'recusado'] as const
    for (const s of statuses) {
      expect(DISPLAY_STATUS_COLORS[s]).toBeTruthy()
      expect(DISPLAY_STATUS_COLORS[s]).toContain('bg-')
      expect(DISPLAY_STATUS_COLORS[s]).toContain('text-')
    }
  })
})

describe('DISPLAY_STATUS_DOT_COLORS', () => {
  it('has dot colors for all display statuses', () => {
    const statuses = ['aberto', 'em_andamento', 'concluido', 'recusado'] as const
    for (const s of statuses) {
      expect(DISPLAY_STATUS_DOT_COLORS[s]).toBeTruthy()
      expect(DISPLAY_STATUS_DOT_COLORS[s]).toContain('bg-')
    }
  })
})

describe('OPEN_SUB_LABELS', () => {
  it('has sub-labels for open statuses', () => {
    expect(OPEN_SUB_LABELS.pendente).toBe('Aguardando análise')
    expect(OPEN_SUB_LABELS.aprovado).toContain('Aprovado')
    expect(OPEN_SUB_LABELS.reopen_requested).toContain('Reabertura')
  })
})

describe('TICKET_STATUS_LABELS', () => {
  it('covers all ticket statuses', () => {
    const allStatuses: TicketStatus[] = [
      'pendente', 'aprovado', 'recusado', 'em_desenvolvimento', 'concluido', 'reopen_requested',
    ]
    for (const s of allStatuses) {
      expect(TICKET_STATUS_LABELS[s]).toBeTruthy()
    }
  })
})

describe('DEV_SUBSTATUS_LABELS', () => {
  it('covers all dev substatuses', () => {
    expect(DEV_SUBSTATUS_LABELS.banco_de_dados).toBe('Banco de Dados')
    expect(DEV_SUBSTATUS_LABELS.integracao).toBe('Integração')
    expect(DEV_SUBSTATUS_LABELS.subindo_servidor).toBe('Subindo para Servidor')
    expect(DEV_SUBSTATUS_LABELS.em_teste).toBe('Em Teste')
  })
})

describe('DEPARTMENTS', () => {
  it('has at least 5 departments', () => {
    expect(DEPARTMENTS.length).toBeGreaterThanOrEqual(5)
  })

  it('includes Tecnologia', () => {
    expect(DEPARTMENTS).toContain('Tecnologia')
  })
})

describe('APP_ROUTES', () => {
  it('has all required routes', () => {
    expect(APP_ROUTES.login).toBe('/login')
    expect(APP_ROUTES.app).toBe('/app')
    expect(APP_ROUTES.newTicket).toBe('/app/novo')
    expect(APP_ROUTES.admin).toBe('/admin')
    expect(APP_ROUTES.adminQueue).toBe('/admin/fila')
    expect(APP_ROUTES.adminProjects).toBe('/admin/projetos')
    expect(APP_ROUTES.adminTemplates).toBe('/admin/templates')
    expect(APP_ROUTES.adminMentoring).toBe('/admin/mentoria')
    expect(APP_ROUTES.appMentoring).toBe('/app/mentoria')
  })

  it('generates dynamic routes correctly', () => {
    expect(APP_ROUTES.ticket('abc-123')).toBe('/app/abc-123')
    expect(APP_ROUTES.adminProject('xyz-456')).toBe('/admin/projetos/xyz-456')
  })
})
