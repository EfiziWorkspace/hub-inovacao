-- =============================================================
-- MIGRATION COMPLETA - painel-inovacao
-- Execute este arquivo inteiro no SQL Editor do Supabase Dashboard
-- =============================================================

-- ========================
-- 1. TABELA PROFILES
-- ========================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  avatar_url text,
  department text,
  role text NOT NULL DEFAULT 'collaborator' CHECK (role IN ('collaborator', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================
-- 2. TABELA TICKETS
-- ========================

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  department text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'recusado', 'em_desenvolvimento', 'concluido')),
  dev_substatus text CHECK (dev_substatus IN ('banco_de_dados', 'integracao', 'subindo_servidor', 'em_teste')),
  doc_urls text[] NOT NULL DEFAULT '{}',
  prototype_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================
-- 3. TABELA TICKET_EVENTS
-- ========================

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

-- ========================
-- 4. INDICES
-- ========================

CREATE INDEX IF NOT EXISTS idx_tickets_author_id ON public.tickets(author_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_department ON public.tickets(department);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON public.tickets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_id ON public.ticket_events(ticket_id, created_at);

-- ========================
-- 5. RLS
-- ========================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_events ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- TICKETS
CREATE POLICY "tickets_select_own"
  ON public.tickets FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "tickets_insert_own"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- TICKET_EVENTS
CREATE POLICY "ticket_events_select_own"
  ON public.ticket_events FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM public.tickets WHERE author_id = auth.uid()
    )
  );

-- ========================
-- 6. REALTIME
-- ========================

ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_events;

-- ========================
-- 7. STORAGE BUCKET
-- ========================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-files',
  'ticket-files',
  false,
  10485760,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ticket-files'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_read_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ticket-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
