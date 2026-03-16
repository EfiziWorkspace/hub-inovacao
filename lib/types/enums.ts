export type TicketStatus =
  | 'pendente'
  | 'aprovado'
  | 'recusado'
  | 'em_desenvolvimento'
  | 'concluido'
  | 'reopen_requested'

export type DevSubstatus =
  | 'banco_de_dados'
  | 'integracao'
  | 'subindo_servidor'
  | 'em_teste'

export type UserRole = 'collaborator' | 'admin'

export type EventType =
  | 'created'
  | 'status_changed'
  | 'substatus_changed'
  | 'observation_added'
  | 'reopen_requested'
  | 'reopened'

export type MentoringStatus = 'agendada' | 'concluida' | 'cancelada'

export type BadgeType =
  | 'primeira_ideia'
  | 'cinco_ideias'
  | 'ideia_aprovada'
  | 'tres_aprovadas'
  | 'ideia_concluida'
  | 'participou_mentoria'

export interface TemplateField {
  label: string
  placeholder: string
  required: boolean
}
