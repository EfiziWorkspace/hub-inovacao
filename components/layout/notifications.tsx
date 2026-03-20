'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell, Plus, CheckCircle, Wrench, MessageSquare,
  AlertCircle, RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'
import { getNotifications } from '@/actions/tickets'
import { TICKET_STATUS_LABELS } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { TicketStatus } from '@/lib/types/enums'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  ticket_id: string
  event_type: string
  new_value: string | null
  comment: string | null
  created_at: string
  ticket_title: string
  actor_name: string
  read: boolean
}

const EVENT_MESSAGES: Record<string, string> = {
  created: 'Nova ideia submetida',
  status_changed: 'Status atualizado',
  substatus_changed: 'Etapa atualizada',
  observation_added: 'Nova observação',
  reopen_requested: 'Reabertura solicitada',
  reopened: 'Chamado reaberto',
}

const EVENT_ICONS: Record<string, { icon: typeof Plus; className: string; bgClassName: string }> = {
  created: { icon: Plus, className: 'text-primary', bgClassName: 'bg-primary/15' },
  status_changed: { icon: CheckCircle, className: 'text-success', bgClassName: 'bg-success/15' },
  substatus_changed: { icon: Wrench, className: 'text-info', bgClassName: 'bg-info/15' },
  observation_added: { icon: MessageSquare, className: 'text-secondary', bgClassName: 'bg-secondary/15' },
  reopen_requested: { icon: AlertCircle, className: 'text-warning', bgClassName: 'bg-warning/15' },
  reopened: { icon: RotateCcw, className: 'text-info', bgClassName: 'bg-info/15' },
}

interface NotificationsProps {
  role: 'admin' | 'collaborator'
  userId: string
}

export function Notifications({ role, userId }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [hasNew, setHasNew] = useState(false)

  useEffect(() => {
    async function load() {
      const data = await getNotifications(role, userId)
      if (data.length > 0) {
        setNotifications(data.map((e: any) => ({
          id: e.id,
          ticket_id: e.ticket_id,
          event_type: e.event_type,
          new_value: e.new_value,
          comment: e.comment,
          created_at: e.created_at,
          ticket_title: e.ticket_title,
          actor_name: e.actor_name,
          read: false,
        })))
      }
    }
    load()
  }, [role, userId])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_events' },
        async (payload) => {
          const event = payload.new as any
          if (event.actor_id === userId) return

          const { data: ticket } = await supabase.from('tickets').select('title, author_id').eq('id', event.ticket_id).single()
          if (role === 'collaborator' && ticket?.author_id !== userId) return

          const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', event.actor_id).single()

          setNotifications((prev) => [{
            id: event.id, ticket_id: event.ticket_id, event_type: event.event_type,
            new_value: event.new_value, comment: event.comment, created_at: event.created_at,
            ticket_title: ticket?.title ?? 'Chamado', actor_name: profile?.full_name ?? 'Usuário', read: false,
          }, ...prev.slice(0, 14)])
          setHasNew(true)
        }
      ).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [role, userId])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setHasNew(false)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  function getHref(notif: Notification): string {
    return role === 'admin' ? `/admin/projetos/${notif.ticket_id}` : `/app/${notif.ticket_id}`
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 rounded-lg"
        onClick={() => { setOpen(true); markAllRead() }}
      >
        <Bell className="h-4 w-4" />
        {(hasNew || unreadCount > 0) && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-full sm:max-w-sm p-0">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base">Notificações</SheetTitle>
              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Bell className="h-7 w-7 text-muted-foreground/30" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Tudo tranquilo por aqui</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Nenhuma notificação no momento</p>
                </div>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notif) => {
                  const config = EVENT_ICONS[notif.event_type]
                  const Icon = config?.icon ?? Bell
                  return (
                    <Link
                      key={notif.id}
                      href={getHref(notif)}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-start gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer',
                        !notif.read && 'bg-primary/[0.03]'
                      )}
                    >
                      <div className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                        config?.bgClassName ?? 'bg-muted'
                      )}>
                        <Icon className={cn('h-4 w-4', config?.className ?? 'text-muted-foreground')} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">
                          <span className="font-semibold">{notif.actor_name}</span>{' '}
                          <span className="text-muted-foreground">{EVENT_MESSAGES[notif.event_type] ?? notif.event_type}</span>
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{notif.ticket_title}</p>
                        {notif.event_type === 'status_changed' && notif.new_value && (
                          <p className="text-xs text-primary mt-0.5">
                            → {TICKET_STATUS_LABELS[notif.new_value as TicketStatus] ?? notif.new_value}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
