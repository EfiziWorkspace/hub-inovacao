-- Migration 3: Tabela ticket_events

CREATE TABLE IF NOT EXISTS public.ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('created', 'status_changed', 'substatus_changed', 'observation_added')),
  old_value text,
  new_value text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
