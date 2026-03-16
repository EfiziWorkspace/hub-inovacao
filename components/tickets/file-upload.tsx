'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadProps {
  userId: string
  ticketTempId: string
  accept?: string
  maxFiles?: number
  label: string
  onUpload: (urls: string[]) => void
}

export function FileUpload({
  userId,
  ticketTempId,
  accept = '.pdf,.doc,.docx',
  maxFiles = 5,
  label,
  onUpload,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<{ name: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return
    if (files.length + selected.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivo(s) permitido`)
      return
    }

    setUploading(true)
    const supabase = createClient()
    const newFiles: { name: string; url: string }[] = []

    for (const file of Array.from(selected)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} excede 10MB`)
        continue
      }

      const path = `${userId}/${ticketTempId}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('ticket-files').upload(path, file)

      if (error) {
        toast.error(`Erro ao enviar ${file.name}`)
      } else {
        newFiles.push({ name: file.name, url: path })
        toast.success(`${file.name} enviado`)
      }
    }

    const updated = [...files, ...newFiles]
    setFiles(updated)
    onUpload(updated.map((f) => f.url))
    setUploading(false)
  }

  function remove(index: number) {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onUpload(updated.map((f) => f.url))
  }

  return (
    <div className="space-y-2">
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">Clique ou arraste • Máx. 10MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => remove(i)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {uploading && <p className="text-xs text-muted-foreground">Enviando...</p>}
    </div>
  )
}
