'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell,
  Plus,
  CheckCircle,
  Wrench,
  MessageSquare,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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

  // Load initial notifications via server action (bypasses RLS)
  useEffect(() => {
    async function load() {
      const data = await getNotifications(role, userId)

      if (data.length > 0) {
        const mapped = data.map((e: any) => ({
          id: e.id,
          ticket_id: e.ticket_id,
          event_type: e.event_type,
          new_value: e.new_value,
          comment: e.comment,
          created_at: e.created_at,
          ticket_title: e.ticket_title,
          actor_name: e.actor_name,
          read: false,
        }))
        setNotifications(mapped)
      }
    }
    load()
  }, [role, userId])

  // Realtime subscription for new events
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_events',
        },
        async (payload) => {
          const event = payload.new as any
          // Don't notify about own actions
          if (event.actor_id === userId) return

          // Fetch related data
          const { data: ticket } = await supabase
            .from('tickets')
            .select('title, author_id')
            .eq('id', event.ticket_id)
            .single()

          // Collaborator only gets notified about their own tickets
          if (role === 'collaborator' && ticket?.author_id !== userId) return

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', event.actor_id)
            .single()

          const newNotif: Notification = {
            id: event.id,
            ticket_id: event.ticket_id,
            event_type: event.event_type,
            new_value: event.new_value,
            comment: event.comment,
            created_at: event.created_at,
            ticket_title: ticket?.title ?? 'Chamado',
            actor_name: profile?.full_name ?? 'Usuário',
            read: false,
          }

          setNotifications((prev) => [newNotif, ...prev.slice(0, 14)])
          setHasNew(true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [role, userId])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setHasNew(false)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  function getNotificationHref(notif: Notification): string {
    if (role === 'admin') {
      return `/admin/projetos/${notif.ticket_id}`
    }
    return `/app/${notif.ticket_id}`
  }

  function renderEventIcon(eventType: string) {
    const config = EVENT_ICONS[eventType]
    if (!config) return null
    const Icon = config.icon
    return (
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', config.bgClassName)}>
        <Icon className={cn('h-4 w-4', config.className)} />
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o)
      if (o) markAllRead()
    }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {(hasNew || unreadCount > 0) && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">{unreadCount} nova(s)</span>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Tudo tranquilo por aqui</p>
              <p className="text-xs text-muted-foreground/70">Nenhuma notificação no momento</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={getNotificationHref(notif)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-start gap-3 px-3 py-3 hover:bg-muted/50 transition-colors rounded-lg mx-1 cursor-pointer',
                    !notif.read && 'bg-primary/5'
                  )}
                >
                  {renderEventIcon(notif.event_type)}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{notif.actor_name}</span>{' '}
                      <span className="text-muted-foreground">
                        {EVENT_MESSAGES[notif.event_type] ?? notif.event_type}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{notif.ticket_title}</p>
                    {notif.event_type === 'status_changed' && notif.new_value && (
                      <p className="text-xs text-primary">
                        → {TICKET_STATUS_LABELS[notif.new_value as TicketStatus] ?? notif.new_value}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
