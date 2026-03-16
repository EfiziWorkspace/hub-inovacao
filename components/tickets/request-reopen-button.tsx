'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { requestReopen } from '@/actions/reviews'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'

export function RequestReopenButton({ ticketId }: { ticketId: string }) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRequest() {
    if (!comment.trim()) {
      toast.error('Por favor, descreva o motivo da reabertura.')
      return
    }

    setLoading(true)
    const result = await requestReopen(ticketId, comment)
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Solicitação de reabertura enviada!')
      setOpen(false)
      setComment('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <RotateCcw className="h-4 w-4" />
          Solicitar Reabertura
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar Reabertura</DialogTitle>
          <DialogDescription>
            Descreva o motivo para reabrir este chamado. O admin será notificado e avaliará sua solicitação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Motivo da reabertura</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Explique por que este chamado precisa ser reaberto..."
            className="resize-none"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleRequest} disabled={loading || !comment.trim()} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            {loading ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
