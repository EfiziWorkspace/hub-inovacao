'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  X,
  FileText,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createTemplate, updateTemplate, toggleTemplateActive, deleteTemplate } from '@/actions/templates'
import { toast } from 'sonner'

interface TemplateField {
  label: string
  placeholder: string
  required: boolean
}

interface Template {
  id: string
  name: string
  description: string | null
  fields_json: TemplateField[]
  is_active: boolean
  created_at: string
}

const EMPTY_FIELD: TemplateField = { label: '', placeholder: '', required: false }

export function TemplateManager({ templates }: { templates: Template[] }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<TemplateField[]>([{ ...EMPTY_FIELD }])

  function openCreateDialog() {
    setEditingTemplate(null)
    setName('')
    setDescription('')
    setFields([{ ...EMPTY_FIELD }])
    setDialogOpen(true)
  }

  function openEditDialog(template: Template) {
    setEditingTemplate(template)
    setName(template.name)
    setDescription(template.description ?? '')
    setFields(
      template.fields_json.length > 0
        ? template.fields_json.map((f) => ({ ...f }))
        : [{ ...EMPTY_FIELD }]
    )
    setDialogOpen(true)
  }

  function addField() {
    setFields((prev) => [...prev, { ...EMPTY_FIELD }])
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  function updateField(index: number, key: keyof TemplateField, value: string | boolean) {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [key]: value } : f))
    )
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error('Nome do template é obrigatório.')
      return
    }

    const validFields = fields.filter((f) => f.label.trim() !== '')
    if (validFields.length === 0) {
      toast.error('Adicione pelo menos um campo com label.')
      return
    }

    const formData = new FormData()
    formData.set('name', name.trim())
    formData.set('description', description.trim())
    formData.set('fields_json', JSON.stringify(validFields))

    if (editingTemplate) {
      formData.set('id', editingTemplate.id)
    }

    startTransition(async () => {
      const action = editingTemplate ? updateTemplate : createTemplate
      const result = await action(formData)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(editingTemplate ? 'Template atualizado!' : 'Template criado!')
        setDialogOpen(false)
      }
    })
  }

  function handleToggle(templateId: string) {
    startTransition(async () => {
      const result = await toggleTemplateActive(templateId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Status do template alterado.')
      }
    })
  }

  function handleDelete(templateId: string) {
    if (!confirm('Tem certeza que deseja excluir este template?')) return
    startTransition(async () => {
      const result = await deleteTemplate(templateId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Template excluído.')
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {templates.length} {templates.length === 1 ? 'template' : 'templates'}
        </p>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {templates.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium text-lg">Nenhum template criado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie seu primeiro template para estruturar as ideias.
            </p>
            <Button onClick={openCreateDialog} className="mt-4" size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Criar template
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {templates.map((template, i) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Card
                  className={cn(
                    'group border-l-[3px] border-l-info hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 h-full',
                    !template.is_active && 'opacity-60'
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 shrink-0 text-info" />
                        <h3 className="font-medium text-sm leading-snug line-clamp-1">
                          {template.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!template.is_active && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {template.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {template.fields_json.length}{' '}
                        {template.fields_json.length === 1 ? 'campo' : 'campos'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(template)}
                          title="Editar template"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleToggle(template.id)}
                          disabled={isPending}
                          title={template.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {template.is_active ? (
                            <ToggleRight className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive/70 hover:text-destructive"
                          onClick={() => handleDelete(template.id)}
                          disabled={isPending}
                          title="Excluir template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome *</Label>
              <Input
                id="template-name"
                placeholder="Ex: Ideia de Sistema"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="template-description">Descrição</Label>
              <Textarea
                id="template-description"
                placeholder="Descreva o propósito deste template..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Fields builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Campos do formulário</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addField}
                  className="h-7 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Adicionar campo
                </Button>
              </div>

              <div className="space-y-3 rounded-lg bg-muted/30 p-3">
                {fields.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum campo adicionado. Clique em &quot;Adicionar campo&quot;.
                  </p>
                ) : (
                  fields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-md border bg-background p-3"
                    >
                      <GripVertical className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground/40 cursor-grab" />

                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Label do campo"
                            value={field.label}
                            onChange={(e) => updateField(index, 'label', e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder="Placeholder"
                            value={field.placeholder}
                            onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`required-${index}`}
                            checked={field.required}
                            onCheckedChange={(checked) =>
                              updateField(index, 'required', checked === true)
                            }
                          />
                          <Label
                            htmlFor={`required-${index}`}
                            className="text-xs font-normal text-muted-foreground cursor-pointer"
                          >
                            Obrigatório
                          </Label>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeField(index)}
                        title="Remover campo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                'Salvando...'
              ) : editingTemplate ? (
                'Salvar alterações'
              ) : (
                'Criar template'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
