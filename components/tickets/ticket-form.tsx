'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTicketSchema } from '@/lib/schemas/ticket'
import { z } from 'zod'
import { createTicket } from '@/actions/tickets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from './file-upload'
import { DEPARTMENTS } from '@/lib/constants'
import { Lightbulb, FileText, Send, Loader2, LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type FormInput = z.input<typeof createTicketSchema>

interface TemplateField {
  label: string
  placeholder: string
  required: boolean
}

interface TicketFormProps {
  userId: string
  defaultDepartment?: string
  template?: {
    id: string
    name: string
    fields_json: TemplateField[]
  }
}

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </div>
  )
}

function RequiredDot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block ml-1" />
}

export function TicketForm({ userId, defaultDepartment, template }: TicketFormProps) {
  const [tempId] = useState(() => crypto.randomUUID())
  const [docUrls, setDocUrls] = useState<string[]>([])
  const [prototypeUrl, setPrototypeUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [templateResponses, setTemplateResponses] = useState<Record<string, string>>(() => {
    if (!template) return {}
    const initial: Record<string, string> = {}
    for (const field of template.fields_json) {
      initial[field.label] = ''
    }
    return initial
  })

  const form = useForm<FormInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      department: defaultDepartment ?? '',
      doc_urls: [],
      prototype_url: null,
    },
  })

  function handleTemplateFieldChange(label: string, value: string) {
    setTemplateResponses((prev) => ({ ...prev, [label]: value }))
  }

  async function onSubmit(data: FormInput) {
    // Validate required template fields
    if (template) {
      const missingRequired = template.fields_json
        .filter((f) => f.required && !templateResponses[f.label]?.trim())
      if (missingRequired.length > 0) return
    }

    setSubmitting(true)
    const fd = new FormData()
    fd.set('title', data.title)
    fd.set('description', data.description)
    fd.set('department', data.department)
    fd.set('doc_urls', JSON.stringify(docUrls))
    fd.set('prototype_url', prototypeUrl ?? '')

    if (template) {
      fd.set('template_id', template.id)
      fd.set('template_responses', JSON.stringify(templateResponses))
    }

    await createTicket(fd)
    setSubmitting(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Template badge */}
        {template && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs">
              <LayoutTemplate className="h-3 w-3" />
              Template: {template.name}
            </Badge>
          </div>
        )}

        {/* Section 1: Sobre a ideia */}
        <div className="space-y-5">
          <SectionHeader icon={Lightbulb} title="Sobre a ideia" />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center">
                  Título da ideia
                  <RequiredDot />
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Sistema de gestão de férias" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center">
                  Descrição
                  <RequiredDot />
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva sua ideia em detalhes: qual problema resolve, quem se beneficia, como funciona..."
                    className="min-h-32 resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center">
                  Setor
                  <RequiredDot />
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu setor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Template custom fields */}
        {template && template.fields_json.length > 0 && (
          <>
            <div className="border-t border-border/60" />

            <div className="space-y-5">
              <SectionHeader icon={LayoutTemplate} title="Campos do template" />

              {template.fields_json.map((field) => (
                <div key={field.label} className="space-y-2">
                  <label
                    htmlFor={`template-field-${field.label}`}
                    className="text-sm font-medium inline-flex items-center"
                  >
                    {field.label}
                    {field.required && <RequiredDot />}
                  </label>
                  <Input
                    id={`template-field-${field.label}`}
                    placeholder={field.placeholder}
                    value={templateResponses[field.label] ?? ''}
                    onChange={(e) => handleTemplateFieldChange(field.label, e.target.value)}
                    required={field.required}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Divider */}
        <div className="border-t border-border/60" />

        {/* Section 2: Documentação */}
        <div className="space-y-5">
          <SectionHeader icon={FileText} title="Documentação" />

          <div className="space-y-2">
            <FormLabel>Documentação de apoio</FormLabel>
            <FileUpload
              userId={userId}
              ticketTempId={tempId}
              accept=".pdf,.doc,.docx"
              maxFiles={5}
              label="Envie PDFs ou documentos Word"
              onUpload={setDocUrls}
            />
          </div>

          <div className="space-y-2">
            <FormLabel>
              Protótipo HTML{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </FormLabel>
            <FileUpload
              userId={userId}
              ticketTempId={tempId}
              accept=".html"
              maxFiles={1}
              label="Envie um protótipo HTML"
              onUpload={(urls) => setPrototypeUrl(urls[0] ?? null)}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/60" />

        {/* Submit area */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button variant="ghost" asChild type="button">
            <Link href="/app">Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className={cn('w-full sm:w-auto gap-2')}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Ideia
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
