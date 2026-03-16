'use client'

import { useState } from 'react'
import { type Variants, motion } from 'framer-motion'
import { FileText, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TemplateField {
  label: string
  placeholder: string
  required: boolean
}

export interface TemplateOption {
  id: string
  name: string
  description: string | null
  fields_json: TemplateField[]
}

interface TemplatePickerProps {
  templates: TemplateOption[]
  onSelect: (template: TemplateOption | null) => void
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export function TemplatePicker({ templates, onSelect }: TemplatePickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function handleSelect(template: TemplateOption | null) {
    const id = template?.id ?? '__skip__'
    setSelectedId(id)
    // Small delay so the user sees the selection state before transition
    setTimeout(() => onSelect(template), 200)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">Escolha um template</h2>
        <p className="text-sm text-muted-foreground">
          Templates ajudam a estruturar sua ideia
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Skip template card */}
        <motion.button
          type="button"
          variants={item}
          onClick={() => handleSelect(null)}
          className={cn(
            'group relative flex flex-col items-start gap-3 rounded-lg border-2 border-dashed p-5 text-left transition-all duration-200',
            'hover:-translate-y-0.5 hover:shadow-md',
            'border-l-[3px] border-l-muted-foreground',
            selectedId === '__skip__'
              ? 'border-primary ring-1 ring-primary/20 bg-primary/5'
              : 'border-border hover:border-muted-foreground/60'
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
            <Sparkles className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-foreground">Sem template</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Comece do zero com o formulário padrão
            </p>
          </div>
        </motion.button>

        {/* Template cards */}
        {templates.map((template) => {
          const fieldCount = template.fields_json.length
          const isSelected = selectedId === template.id

          return (
            <motion.button
              key={template.id}
              type="button"
              variants={item}
              onClick={() => handleSelect(template)}
              className={cn(
                'group relative flex flex-col items-start gap-3 rounded-lg border p-5 text-left transition-all duration-200',
                'hover:-translate-y-0.5 hover:shadow-md',
                'border-l-[3px] border-l-info',
                isSelected
                  ? 'border-primary ring-1 ring-primary/20 bg-primary/5'
                  : 'border-border hover:border-info/60'
              )}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-info/10">
                  <FileText className="h-4.5 w-4.5 text-info" />
                </div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  {fieldCount} {fieldCount === 1 ? 'campo' : 'campos'}
                </Badge>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-foreground">
                  {template.name}
                </span>
                {template.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {template.description}
                  </p>
                )}
              </div>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
