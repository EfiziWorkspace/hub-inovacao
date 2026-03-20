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
import { FileUpload } from '@/components/tickets/file-upload'
import { requestReopen } from '@/actions/reviews'
import { toast } from 'sonner'
import { RotateCcw, AlertCircle } from 'lucide-react'

interface RequestReopenButtonProps {
  ticketId: string
  userId: string
}

export function RequestReopenButton({ ticketId, userId }: RequestReopenButtonProps) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [docUrls, setDocUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  async function handleRequest() {
    if (!comment.trim()) {
      toast.error('Descreva o motivo e o que foi alterado.')
      return
    }

    if (docUrls.length === 0) {
      toast.error('Envie a documentação atualizada.')
      return
    }

    setLoading(true)
    const result = await requestReopen(ticketId, comment, docUrls)
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Solicitação de reabertura enviada!')
      setOpen(false)
      setComment('')
      setDocUrls([])
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar Reabertura</DialogTitle>
          <DialogDescription>
            Envie a documentação atualizada e descreva o que foi alterado. O admin será notificado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo das alterações */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              O que foi alterado?
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: Atualizei o escopo do projeto, adicionei novas telas no protótipo..."
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Upload de nova documentação */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              Nova documentação
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </Label>
            <p className="text-xs text-muted-foreground">
              A documentação anterior será substituída pela nova.
            </p>
            <FileUpload
              userId={userId}
              ticketTempId={`reopen-${ticketId}`}
              label="Envie a documentação atualizada"
              required
              onUpload={setDocUrls}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleRequest}
            disabled={loading || !comment.trim() || docUrls.length === 0}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            {loading ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
