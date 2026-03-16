-- Migration 6: Habilitar Realtime para ticket_events

ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_events;
