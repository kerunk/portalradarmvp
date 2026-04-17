-- ============================================================
-- MIGRATION: Tabela experiences para ExperiencesMVP
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.experiences (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date          TEXT NOT NULL DEFAULT '',
  context       TEXT NOT NULL DEFAULT '',
  human_factors TEXT DEFAULT '',
  deviations    TEXT DEFAULT '',
  action_taken  TEXT DEFAULT '',
  learning      TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view experiences of their company"
  ON public.experiences FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can insert experiences of their company"
  ON public.experiences FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can update experiences of their company"
  ON public.experiences FOR UPDATE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can delete experiences of their company"
  ON public.experiences FOR DELETE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE INDEX IF NOT EXISTS idx_experiences_company ON public.experiences(company_id);
CREATE INDEX IF NOT EXISTS idx_experiences_date    ON public.experiences(date);

-- ============================================================
-- Colunas JSON nas turmas (se ainda não existirem)
-- ============================================================
ALTER TABLE public.turmas
  ADD COLUMN IF NOT EXISTS participants_json TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS attendance_json   TEXT;
