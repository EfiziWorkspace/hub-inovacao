'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Globe, Download, Eye, Loader2 } from 'lucide-react'
import { getSignedUrl } from '@/actions/tickets'
import { toast } from 'sonner'

interface FileDownloadListProps {
  docUrls: string[]
  prototypeUrl: string | null
}

export function FileDownloadList({ docUrls, prototypeUrl }: FileDownloadListProps) {
  const hasFiles = docUrls.length > 0 || !!prototypeUrl
  if (!hasFiles) return null

  return (
    <div className="space-y-2">
      {docUrls.map((url, i) => (
        <FileItem key={i} path={url} />
      ))}
      {prototypeUrl && <FileItem path={prototypeUrl} isPrototype />}
    </div>
  )
}

function FileItem({ path, isPrototype }: { path: string; isPrototype?: boolean }) {
  const [loading, setLoading] = useState(false)
  const fileName = path.split('/').pop() ?? 'arquivo'
  const Icon = isPrototype ? Globe : FileText

  async function handleDownload() {
    setLoading(true)
    const result = await getSignedUrl(path, 120)
    setLoading(false)

    if (result.url) {
      const a = document.createElement('a')
      a.href = result.url
      a.download = fileName
      a.target = '_blank'
      a.click()
    } else {
      toast.error('Não foi possível gerar o link de download.')
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 group hover:border-primary/30 hover:bg-primary/5 transition-colors">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {isPrototype ? 'Protótipo HTML' : fileName}
        </p>
        <p className="text-xs text-muted-foreground">
          {isPrototype ? 'Arquivo HTML' : fileName.split('.').pop()?.toUpperCase() ?? 'Arquivo'}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        disabled={loading}
        className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline text-xs">Baixar</span>
      </Button>
    </div>
  )
}
