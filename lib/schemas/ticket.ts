import { z } from 'zod'
import { DEPARTMENTS } from '@/lib/constants'

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .min(20, 'Descrição deve ter pelo menos 20 caracteres')
    .max(5000, 'Descrição deve ter no máximo 5000 caracteres'),
  department: z
    .string()
    .refine((val) => DEPARTMENTS.includes(val), {
      message: 'Selecione um setor válido',
    }),
  doc_urls: z.array(z.string()).default([]),
  prototype_url: z.string().nullable().default(null),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>
