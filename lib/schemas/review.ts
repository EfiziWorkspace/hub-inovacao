import { z } from 'zod'

export const reviewTicketSchema = z.object({
  ticket_id: z.string().uuid(),
  action: z.enum(['aprovado', 'recusado']),
  comment: z.string().max(1000).optional(),
})

export const updateDevStatusSchema = z.object({
  ticket_id: z.string().uuid(),
  dev_substatus: z.enum(['banco_de_dados', 'integracao', 'subindo_servidor', 'em_teste']).nullable(),
  conclude: z.boolean().default(false),
  comment: z.string().max(1000).optional(),
})

export type ReviewTicketInput = z.infer<typeof reviewTicketSchema>
export type UpdateDevStatusInput = z.infer<typeof updateDevStatusSchema>
