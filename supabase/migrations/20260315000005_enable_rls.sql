-- Migration 5: RLS - habilitar e criar policies

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_events ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES =====
-- Usuario le o proprio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuario atualiza o proprio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ===== TICKETS =====
-- Colaborador le apenas os proprios tickets
CREATE POLICY "tickets_select_own"
  ON public.tickets FOR SELECT
  USING (auth.uid() = author_id);

-- Colaborador cria ticket com seu proprio author_id
CREATE POLICY "tickets_insert_own"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Nenhum UPDATE via client (so via service_role no server)
-- (sem policy de UPDATE = bloqueado por padrao)

-- ===== TICKET_EVENTS =====
-- Colaborador le eventos dos seus proprios tickets
CREATE POLICY "ticket_events_select_own"
  ON public.ticket_events FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM public.tickets WHERE author_id = auth.uid()
    )
  );

-- Nenhum INSERT via client (so via service_role)
