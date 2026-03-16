'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateDevStatus } from '@/actions/reviews'
import { DEV_SUBSTATUS_LABELS } from '@/lib/constants'
import type { DevSubstatus } from '@/lib/types/enums'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'

interface DevStatusSelectProps {
  ticketId: string
  currentSubstatus: DevSubstatus | null
}

const SUBSTATUS_OPTIONS: DevSubstatus[] = ['banco_de_dados', 'integracao', 'subindo_servidor', 'em_teste']

export function DevStatusSelect({ ticketId, currentSubstatus }: DevStatusSelectProps) {
  const [substatus, setSubstatus] = useState<string>(currentSubstatus ?? '')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave(conclude = false) {
    setLoading(true)
    const fd = new FormData()
    fd.set('ticket_id', ticketId)
    fd.set('dev_substatus', substatus)
    fd.set('conclude', String(conclude))
    if (comment) fd.set('comment', comment)

    const result = await updateDevStatus(fd)
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(conclude ? 'Projeto concluído!' : 'Etapa atualizada!')
      setComment('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Etapa atual</Label>
        <Select value={substatus} onValueChange={setSubstatus}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a etapa" />
          </SelectTrigger>
          <SelectContent>
            {SUBSTATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{DEV_SUBSTATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Observação <span className="text-muted-foreground font-normal">(opcional)</span></Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Atualização para o colaborador..."
          className="resize-none"
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={loading || !substatus}>
          {loading ? 'Salvando...' : 'Atualizar etapa'}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={loading} className="gap-1.5">
          <CheckCircle className="h-4 w-4" />
          Concluir projeto
        </Button>
      </div>
    </div>
  )
}
