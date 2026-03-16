'use client'

import { useState } from 'react'
import { TemplatePicker, type TemplateOption } from '@/components/templates/template-picker'
import { TicketForm } from '@/components/tickets/ticket-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

type Step = 'pick' | 'form'

interface NewTicketFlowProps {
  userId: string
  defaultDepartment?: string
  templates: TemplateOption[]
}

export function NewTicketFlow({ userId, defaultDepartment, templates }: NewTicketFlowProps) {
  const hasTemplates = templates.length > 0
  const [step, setStep] = useState<Step>(hasTemplates ? 'pick' : 'form')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null)

  function handleTemplateSelect(template: TemplateOption | null) {
    setSelectedTemplate(template)
    setStep('form')
  }

  function handleBackToPicker() {
    setSelectedTemplate(null)
    setStep('pick')
  }

  if (step === 'pick') {
    return <TemplatePicker templates={templates} onSelect={handleTemplateSelect} />
  }

  return (
    <div className="space-y-4">
      {hasTemplates && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
          onClick={handleBackToPicker}
        >
          <ArrowLeft className="h-4 w-4" />
          Trocar template
        </Button>
      )}

      <TicketForm
        userId={userId}
        defaultDepartment={defaultDepartment}
        template={selectedTemplate ?? undefined}
      />
    </div>
  )
}
