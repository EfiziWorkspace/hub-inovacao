'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, FileText, Image, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ACCEPTED_TYPES = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WEBP',
  'image/gif': 'GIF',
} as Record<string, string>

const ACCEPT_STRING = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext ?? '')) return Image
  if (['doc', 'docx'].includes(ext ?? '')) return FileSpreadsheet
  return FileText
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

interface FileUploadProps {
  userId: string
  ticketTempId: string
  label: string
  required?: boolean
  onUpload: (urls: string[]) => void
}

export function FileUpload({
  userId,
  ticketTempId,
  label,
  required,
  onUpload,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<{ name: string; url: string; size: number }[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return
    if (files.length + selected.length > MAX_FILES) {
      toast.error(`Máximo de ${MAX_FILES} arquivos permitido`)
      return
    }

    setUploading(true)
    const supabase = createClient()
    const newFiles: { name: string; url: string; size: number }[] = []

    for (const file of Array.from(selected)) {
      // Validar tipo
      if (!ACCEPTED_TYPES[file.type]) {
        toast.error(`${file.name}: tipo não permitido. Use PDF, Word ou imagens.`)
        continue
      }

      // Validar tamanho
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} excede 10MB (${formatSize(file.size)})`)
        continue
      }

      const path = `${userId}/${ticketTempId}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('ticket-files').upload(path, file)

      if (error) {
        toast.error(`Erro ao enviar ${file.name}`)
      } else {
        newFiles.push({ name: file.name, url: path, size: file.size })
      }
    }

    if (newFiles.length > 0) {
      toast.success(`${newFiles.length} arquivo(s) enviado(s)`)
    }

    const updated = [...files, ...newFiles]
    setFiles(updated)
    onUpload(updated.map((f) => f.url))
    setUploading(false)

    // Reset input
    if (inputRef.current) inputRef.current.value = ''
  }

  function remove(index: number) {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onUpload(updated.map((f) => f.url))
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
          dragOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-2" />
        ) : (
          <Upload className={cn('h-8 w-8 mx-auto mb-2', dragOver ? 'text-primary' : 'text-muted-foreground')} />
        )}
        <p className="text-sm font-medium">{uploading ? 'Enviando...' : label}</p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, Word ou imagens • Máx. 10MB por arquivo • Até {MAX_FILES} arquivos
        </p>
        {required && files.length === 0 && (
          <p className="text-xs text-destructive mt-2 flex items-center justify-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Pelo menos 1 documento é obrigatório
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, i) => {
            const Icon = getFileIcon(file.name)
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5 group hover:bg-muted/40 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => remove(i)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
          <p className="text-xs text-muted-foreground">
            {files.length}/{MAX_FILES} arquivo(s)
          </p>
        </div>
      )}
    </div>
  )
}
