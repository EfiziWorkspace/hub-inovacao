import type { TicketStatus, DevSubstatus } from '@/lib/types/enums'

// ---------- Display Status (o que o usuário vê) ----------

export type DisplayStatus = 'aberto' | 'em_andamento' | 'concluido' | 'recusado'

export const DISPLAY_STATUS_LABELS: Record<DisplayStatus, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  recusado: 'Recusado',
}

export const DISPLAY_STATUS_COLORS: Record<DisplayStatus, string> = {
  aberto: 'bg-warning/15 text-warning border-warning/30',
  em_andamento: 'bg-info/15 text-info border-info/30',
  concluido: 'bg-success/15 text-success border-success/30',
  recusado: 'bg-destructive/15 text-destructive border-destructive/30',
}

export const DISPLAY_STATUS_DOT_COLORS: Record<DisplayStatus, string> = {
  aberto: 'bg-warning',
  em_andamento: 'bg-info',
  concluido: 'bg-success',
  recusado: 'bg-destructive',
}

/** Sub-indicadores dentro de "Aberto" */
export const OPEN_SUB_LABELS: Partial<Record<TicketStatus, string>> = {
  pendente: 'Aguardando análise',
  aprovado: 'Aprovado — aguardando início',
  reopen_requested: 'Reabertura solicitada',
}

/** Mapeia status do banco → display status */
export function getDisplayStatus(status: TicketStatus): DisplayStatus {
  switch (status) {
    case 'pendente':
    case 'aprovado':
    case 'reopen_requested':
      return 'aberto'
    case 'em_desenvolvimento':
      return 'em_andamento'
    case 'concluido':
      return 'concluido'
    case 'recusado':
      return 'recusado'
  }
}

// ---------- Labels internos (para timeline e eventos) ----------

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  em_desenvolvimento: 'Em Desenvolvimento',
  concluido: 'Concluído',
  reopen_requested: 'Reabertura Solicitada',
}

export const DEV_SUBSTATUS_LABELS: Record<DevSubstatus, string> = {
  banco_de_dados: 'Banco de Dados',
  integracao: 'Integração',
  subindo_servidor: 'Subindo para Servidor',
  em_teste: 'Em Teste',
}

// ---------- Outros ----------

export const DEPARTMENTS = [
  'Tecnologia',
  'Marketing',
  'Comercial',
  'Financeiro',
  'RH',
  'Operações',
  'Design',
  'Produto',
  'Jurídico',
  'Atendimento',
]

export const APP_ROUTES = {
  login: '/login',
  app: '/app',
  newTicket: '/app/novo',
  ticket: (id: string) => `/app/${id}`,
  admin: '/admin',
  adminQueue: '/admin/fila',
  adminProjects: '/admin/projetos',
  adminProject: (id: string) => `/admin/projetos/${id}`,
  adminTemplates: '/admin/templates',
  adminMentoring: '/admin/mentoria',
  appMentoring: '/app/mentoria',
} as const
