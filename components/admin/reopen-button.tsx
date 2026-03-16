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
import { reopenTicket } from '@/actions/reviews'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'

export function ReopenButton({ ticketId }: { ticketId: string }) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReopen() {
    setLoading(true)
    const result = await reopenTicket(ticketId, comment || undefined)
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Chamado reaberto com sucesso!')
      setOpen(false)
      setComment('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Reabrir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reabrir Chamado</DialogTitle>
          <DialogDescription>
            O chamado voltará para &quot;Em Desenvolvimento&quot; e o colaborador será notificado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Motivo <span className="text-muted-foreground font-normal">(opcional)</span></Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Por que este chamado está sendo reaberto..."
            className="resize-none"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleReopen} disabled={loading} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            {loading ? 'Reabrindo...' : 'Confirmar Reabertura'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
