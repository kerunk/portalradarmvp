-- ============================================================
-- MIGRATION: Operational Data Tables for MVP Portal
-- Run this SQL in Supabase SQL Editor
-- ============================================================

-- 1. Population Members (colaboradores)
CREATE TABLE IF NOT EXISTS public.population_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  sector TEXT DEFAULT '',
  role TEXT DEFAULT '',
  unit TEXT DEFAULT '',
  shift TEXT DEFAULT '',
  admission_date TEXT DEFAULT '',
  facilitator BOOLEAN DEFAULT false,
  nucleo BOOLEAN DEFAULT false,
  leadership BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.population_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view population of their company"
  ON public.population_members FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can insert population of their company"
  ON public.population_members FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can update population of their company"
  ON public.population_members FOR UPDATE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can delete population of their company"
  ON public.population_members FOR DELETE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

-- 2. Turmas (classes/training groups)
CREATE TABLE IF NOT EXISTS public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  facilitator TEXT DEFAULT '',
  start_date TEXT,
  end_date TEXT,
  training_date TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'delayed')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view turmas of their company"
  ON public.turmas FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can insert turmas of their company"
  ON public.turmas FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can update turmas of their company"
  ON public.turmas FOR UPDATE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can delete turmas of their company"
  ON public.turmas FOR DELETE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

-- 3. Turma Participants
CREATE TABLE IF NOT EXISTS public.turma_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.population_members(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sector TEXT DEFAULT '',
  role TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.turma_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view turma participants via turma"
  ON public.turma_participants FOR SELECT TO authenticated
  USING (
    turma_id IN (
      SELECT id FROM public.turmas WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can insert turma participants via turma"
  ON public.turma_participants FOR INSERT TO authenticated
  WITH CHECK (
    turma_id IN (
      SELECT id FROM public.turmas WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can update turma participants via turma"
  ON public.turma_participants FOR UPDATE TO authenticated
  USING (
    turma_id IN (
      SELECT id FROM public.turmas WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can delete turma participants via turma"
  ON public.turma_participants FOR DELETE TO authenticated
  USING (
    turma_id IN (
      SELECT id FROM public.turmas WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

-- 4. Turma Attendance
CREATE TABLE IF NOT EXISTS public.turma_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL, -- member_id as text for flexibility
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'reschedule')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.turma_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attendance via turma"
  ON public.turma_attendance FOR SELECT TO authenticated
  USING (
    turma_id IN (
      SELECT id FROM public.turmas WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can manage attendance via turma"
  ON public.turma_attendance FOR ALL TO authenticated
  USING (
    turma_id IN (
      SELECT id FROM public.turmas WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

-- 5. Cycle States
CREATE TABLE IF NOT EXISTS public.cycle_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle_id TEXT NOT NULL,
  closure_status TEXT DEFAULT 'not_started' CHECK (closure_status IN ('not_started', 'in_progress', 'ready_to_close', 'closed')),
  start_date TEXT,
  planned_end_date TEXT,
  closed_at TEXT,
  closure_notes TEXT DEFAULT '',
  locked_for_editing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, cycle_id)
);

ALTER TABLE public.cycle_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cycle states of their company"
  ON public.cycle_states FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can manage cycle states of their company"
  ON public.cycle_states FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

-- 6. Cycle Actions (per factor per cycle per company)
CREATE TABLE IF NOT EXISTS public.cycle_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle_id TEXT NOT NULL,
  factor_id TEXT NOT NULL,
  action_id TEXT NOT NULL, -- original action ID from template
  title TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT true,
  disabled_reason TEXT DEFAULT '',
  responsible TEXT DEFAULT '',
  due_date TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  observation TEXT DEFAULT '',
  source_decision_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, cycle_id, factor_id, action_id)
);

ALTER TABLE public.cycle_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cycle actions of their company"
  ON public.cycle_actions FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can manage cycle actions of their company"
  ON public.cycle_actions FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

-- 7. Records (decisions, meetings, observations)
CREATE TABLE IF NOT EXISTS public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  cycle_id TEXT,
  factor_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('meeting', 'decision', 'observation', 'risk', 'communication', 'validation')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  creates_actions BOOLEAN DEFAULT false,
  linked_action_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view records of their company"
  ON public.records FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can manage records of their company"
  ON public.records FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

-- 8. Success Factor Overrides (global admin overrides)
CREATE TABLE IF NOT EXISTS public.success_factor_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id TEXT NOT NULL,
  factor_id TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cycle_id, factor_id)
);

ALTER TABLE public.success_factor_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view overrides"
  ON public.success_factor_overrides FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admin_mvp can manage overrides"
  ON public.success_factor_overrides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_mvp'));

-- 9. Org Structure
CREATE TABLE IF NOT EXISTS public.org_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('unit', 'sector', 'shift', 'position')),
  name TEXT NOT NULL,
  archived BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.org_structure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org structure of their company"
  ON public.org_structure FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "Users can manage org structure of their company"
  ON public.org_structure FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_population_company ON public.population_members(company_id);
CREATE INDEX IF NOT EXISTS idx_turmas_company ON public.turmas(company_id);
CREATE INDEX IF NOT EXISTS idx_turmas_cycle ON public.turmas(cycle_id);
CREATE INDEX IF NOT EXISTS idx_cycle_states_company ON public.cycle_states(company_id);
CREATE INDEX IF NOT EXISTS idx_cycle_actions_company ON public.cycle_actions(company_id);
CREATE INDEX IF NOT EXISTS idx_cycle_actions_cycle ON public.cycle_actions(cycle_id);
CREATE INDEX IF NOT EXISTS idx_records_company ON public.records(company_id);
CREATE INDEX IF NOT EXISTS idx_org_structure_company ON public.org_structure(company_id);

-- 11. Check that has_role function exists (should already exist from initial setup)
-- If not, create it:
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
