'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Search, Building2, Clock, FileText, Globe, ChevronRight,
  CheckCircle, XCircle, MessageSquare, Wrench, Plus, Sparkles,
  Download, User
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { reviewTicket } from '@/actions/reviews'
import { getSignedUrl } from '@/actions/tickets'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Profile {
  full_name: string
  email: string
  avatar_url: string | null
  department: string | null
}

interface Ticket {
  id: string
  title: string
  description: string
  department: string
  created_at: string
  doc_urls: string[]
  prototype_url: string | null
  profiles: Profile | null
}

interface TicketEvent {
  id: string
  event_type: string
  old_value: string | null
  new_value: string | null
  comment: string | null
  created_at: string
  profiles: { full_name: string } | null
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  created: Plus,
  status_changed: CheckCircle,
  substatus_changed: Wrench,
  observation_added: MessageSquare,
  reopen_requested: Sparkles,
  reopened: Sparkles,
}

const EVENT_LABELS: Record<string, string> = {
  created: 'Chamado criado',
  status_changed: 'Status atualizado',
  substatus_changed: 'Etapa atualizada',
  observation_added: 'Observação adicionada',
  reopen_requested: 'Reabertura solicitada',
  reopened: 'Chamado reaberto',
}

const isNew = (date: string) =>
  Date.now() - new Date(date).getTime() < 24 * 60 * 60 * 1000

export function QueueView({ tickets }: { tickets: Ticket[] }) {
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [events, setEvents] = useState<TicketEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState<'aprovado' | 'recusado' | null>(null)
  const [prototypeOpen, setPrototypeOpen] = useState(false)

  const sectors = useMemo(
    () => [...new Set(tickets.map((t) => t.department))].sort(),
    [tickets]
  )

  const filtered = useMemo(() => {
    let list = tickets
    if (sectorFilter) list = list.filter((t) => t.department === sectorFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.profiles?.full_name.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q)
      )
    }
    return list
  }, [tickets, sectorFilter, search])

  // Agrupar por setor
  const grouped = useMemo(() => {
    const map: Record<string, Ticket[]> = {}
    for (const t of filtered) {
      if (!map[t.department]) map[t.department] = []
      map[t.department].push(t)
    }
    return map
  }, [filtered])

  const openTicket = useCallback(async (ticket: Ticket) => {
    setSelected(ticket)
    setEvents([])
    setComment('')
    setPrototypeOpen(false)
    setEventsLoading(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('ticket_events')
      .select('id, event_type, old_value, new_value, comment, created_at, profiles(full_name)')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true })

    setEvents((data as unknown as TicketEvent[]) ?? [])
    setEventsLoading(false)
  }, [])

  async function handleAction(action: 'aprovado' | 'recusado') {
    if (!selected) return
    setLoading(action)
    const fd = new FormData()
    fd.set('ticket_id', selected.id)
    fd.set('action', action)
    if (comment) fd.set('comment', comment)

    const result = await reviewTicket(fd)
    setLoading(null)

    if (result?.error) {
      toast.error(result.error)
    } else if (action === 'aprovado') {
      toast.success('Chamado aprovado! Acesse Projetos para acompanhar o desenvolvimento.', {
        action: { label: 'Ver projetos', onClick: () => window.location.href = '/admin/projetos' },
        duration: 6000,
      })
      setSelected(null)
    } else {
      toast.success('Chamado recusado. O colaborador será notificado.')
      setSelected(null)
    }
  }

  async function downloadFile(path: string) {
    const toastId = toast.loading('Gerando link de download...')
    const result = await getSignedUrl(path, 60)
    toast.dismiss(toastId)
    if (result.url) {
      const a = document.createElement('a')
      a.href = result.url
      a.download = path.split('/').pop() ?? 'arquivo'
      a.target = '_blank'
      a.click()
    } else {
      toast.error('Não foi possível baixar o arquivo.')
    }
  }

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      {/* Layout duas colunas */}
      <div className="flex gap-6 h-full">
        {/* Coluna esquerda — lista */}
        <div className="flex flex-col gap-4 w-full max-w-2xl">
          {/* Busca + filtros */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, colaborador ou setor..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {sectors.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSectorFilter(null)}
                  className={cn(
                    'text-xs px-3 py-1 rounded-full border transition-colors',
                    !sectorFilter
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  Todos ({tickets.length})
                </button>
                {sectors.map((s) => {
                  const count = tickets.filter((t) => t.department === s).length
                  return (
                    <button
                      key={s}
                      onClick={() => setSectorFilter(s === sectorFilter ? null : s)}
                      className={cn(
                        'text-xs px-3 py-1 rounded-full border transition-colors',
                        sectorFilter === s
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {s} ({count})
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Lista agrupada por setor */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-sm">Nenhum chamado encontrado.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([sector, items]) => (
                <div key={sector}>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {sector}
                    </span>
                    <span className="text-xs text-muted-foreground">· {items.length}</span>
                  </div>

                  <div className="space-y-1.5">
                    {items.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => openTicket(ticket)}
                        className={cn(
                          'w-full text-left rounded-xl border p-3.5 transition-all duration-150 group',
                          selected?.id === ticket.id
                            ? 'border-primary/60 bg-primary/5'
                            : 'border-border hover:border-primary/30 hover:bg-muted/40'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{ticket.title}</span>
                              {isNew(ticket.created_at) && (
                                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary border-primary/20 shrink-0 animate-pulse">
                                  Novo
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {ticket.profiles?.full_name ?? '—'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ptBR })}
                              </span>
                              {(ticket.doc_urls?.length > 0 || ticket.prototype_url) && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {ticket.doc_urls?.length ?? 0} arquivo(s)
                                  {ticket.prototype_url ? ' + protótipo' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className={cn(
                            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                            selected?.id === ticket.id ? 'text-primary rotate-90' : 'group-hover:translate-x-0.5'
                          )} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty state lado direito (desktop) */}
        {tickets.length > 0 && !selected && (
          <div className="hidden xl:flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border">
            <div className="text-center space-y-2">
              <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">Selecione um chamado para ver os detalhes</p>
            </div>
          </div>
        )}
      </div>

      {/* Sheet de detalhes */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col" side="right">
          {selected && (
            <>
              {/* Header do Sheet */}
              <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                <div className="flex items-start justify-between gap-3 pr-6">
                  <div className="space-y-1 min-w-0">
                    <SheetTitle className="text-base leading-snug">{selected.title}</SheetTitle>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selected.created_at), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {isNew(selected.created_at) && (
                    <Badge className="shrink-0 bg-primary/15 text-primary border-primary/20">Novo</Badge>
                  )}
                </div>
              </SheetHeader>

              {/* Corpo com scroll */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="px-6 py-4 space-y-6">

                  {/* Colaborador */}
                  <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border/60 p-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="text-sm bg-primary/10 text-primary">
                        {initials(selected.profiles?.full_name ?? '?')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{selected.profiles?.full_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">{selected.profiles?.email ?? '—'}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto shrink-0 text-xs">
                      {selected.department}
                    </Badge>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {selected.description}
                    </p>
                  </div>

                  {/* Arquivos */}
                  {(selected.doc_urls?.length > 0 || selected.prototype_url) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Arquivos</h4>
                      <div className="space-y-1.5">
                        {selected.doc_urls?.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => downloadFile(url)}
                            className="w-full flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm hover:border-primary/40 hover:bg-primary/5 transition-colors text-left group"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="flex-1 truncate text-muted-foreground group-hover:text-foreground transition-colors">
                              {url.split('/').pop()}
                            </span>
                            <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </button>
                        ))}

                        {selected.prototype_url && (
                          <div className="space-y-2">
                            <button
                              onClick={() => setPrototypeOpen(!prototypeOpen)}
                              className="w-full flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm hover:border-primary/40 hover:bg-primary/5 transition-colors text-left group"
                            >
                              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="flex-1 text-muted-foreground group-hover:text-foreground transition-colors">
                                Protótipo HTML
                              </span>
                              <span className="text-xs text-muted-foreground">{prototypeOpen ? 'Fechar' : 'Visualizar'}</span>
                            </button>
                            {prototypeOpen && (
                              <div className="rounded-lg border border-border overflow-hidden bg-white">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/60 border-b border-border">
                                  <div className="flex gap-1">
                                    <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-warning/50" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-success/50" />
                                  </div>
                                  <span className="text-xs text-muted-foreground">preview</span>
                                </div>
                                <PrototypePreview url={selected.prototype_url} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Histórico */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Histórico</h4>
                    {eventsLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="flex gap-3 animate-pulse">
                            <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 bg-muted rounded w-32" />
                              <div className="h-3 bg-muted rounded w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : events.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum evento ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        {events.map((event, index) => {
                          const Icon = EVENT_ICONS[event.event_type] ?? Plus
                          const isLast = index === events.length - 1
                          return (
                            <div key={event.id} className="flex gap-3">
                              <div className="flex flex-col items-center shrink-0">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted border border-border">
                                  <Icon className="h-3 w-3 text-muted-foreground" />
                                </div>
                                {!isLast && <div className="w-px flex-1 bg-border mt-1 min-h-3" />}
                              </div>
                              <div className="pb-3 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-medium">
                                    {EVENT_LABELS[event.event_type] ?? event.event_type}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                                  </span>
                                </div>
                                {event.comment && (
                                  <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded px-2 py-1.5">
                                    {event.comment}
                                  </p>
                                )}
                                {event.profiles && (
                                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                                    por {event.profiles.full_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Espaço para o footer fixo não cobrir conteúdo */}
                  <div className="h-4" />
                </div>
              </ScrollArea>

              {/* Footer fixo — ações */}
              <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Observação para o colaborador{' '}
                    <span className="font-normal">(opcional)</span>
                  </Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ex: Ideia interessante! Precisamos alinhar com o time de TI..."
                    className="resize-none text-sm"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                    onClick={() => handleAction('recusado')}
                    disabled={!!loading}
                  >
                    <XCircle className="h-4 w-4" />
                    {loading === 'recusado' ? 'Recusando...' : 'Recusar'}
                  </Button>
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={() => handleAction('aprovado')}
                    disabled={!!loading}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {loading === 'aprovado' ? 'Aprovando...' : 'Aprovar'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

function PrototypePreview({ url }: { url: string }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getSignedUrl(url, 300).then((result) => {
      if (result.url) setSignedUrl(result.url)
      else setError(true)
    })
  }, [url])

  if (error) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
        Não foi possível carregar o protótipo.
      </div>
    )
  }

  if (!signedUrl) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
        Carregando protótipo...
      </div>
    )
  }

  return (
    <iframe
      src={signedUrl}
      className="w-full h-64"
      sandbox="allow-scripts"
      title="Protótipo HTML"
    />
  )
}
