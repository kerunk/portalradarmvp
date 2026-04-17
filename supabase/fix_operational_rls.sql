-- ============================================================
-- FIX: RLS para todas as tabelas operacionais (multi-tenant)
-- Aplica o mesmo padrão usado em org_structure:
--   • Cliente (admin_empresa) só acessa registros da sua company_id
--   • Admin Master (admin_mvp) acessa tudo
-- Usa public.user_company_id(auth.uid()) para evitar recursão de RLS.
--
-- Pré-requisito: a função public.user_company_id já foi criada em
-- supabase/fix_org_structure_rls.sql. Caso ainda não tenha rodado, execute:
--
-- CREATE OR REPLACE FUNCTION public.user_company_id(_user_id uuid)
-- RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
--   SELECT company_id FROM public.profiles WHERE id = _user_id LIMIT 1;
-- $$;
-- ============================================================

-- ─── POPULATION_MEMBERS ───────────────────────────────────────
DROP POLICY IF EXISTS "Users can view population of their company" ON public.population_members;
DROP POLICY IF EXISTS "Users can manage population of their company" ON public.population_members;
DROP POLICY IF EXISTS "population_members select" ON public.population_members;
DROP POLICY IF EXISTS "population_members insert" ON public.population_members;
DROP POLICY IF EXISTS "population_members update" ON public.population_members;
DROP POLICY IF EXISTS "population_members delete" ON public.population_members;

CREATE POLICY "population_members select"
  ON public.population_members FOR SELECT TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "population_members insert"
  ON public.population_members FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "population_members update"
  ON public.population_members FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  )
  WITH CHECK (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "population_members delete"
  ON public.population_members FOR DELETE TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

-- ─── TURMAS ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view turmas of their company" ON public.turmas;
DROP POLICY IF EXISTS "Users can manage turmas of their company" ON public.turmas;
DROP POLICY IF EXISTS "turmas select" ON public.turmas;
DROP POLICY IF EXISTS "turmas insert" ON public.turmas;
DROP POLICY IF EXISTS "turmas update" ON public.turmas;
DROP POLICY IF EXISTS "turmas delete" ON public.turmas;

CREATE POLICY "turmas select"
  ON public.turmas FOR SELECT TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "turmas insert"
  ON public.turmas FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "turmas update"
  ON public.turmas FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  )
  WITH CHECK (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "turmas delete"
  ON public.turmas FOR DELETE TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

-- ─── CYCLE_STATES ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view cycle_states of their company" ON public.cycle_states;
DROP POLICY IF EXISTS "Users can manage cycle_states of their company" ON public.cycle_states;
DROP POLICY IF EXISTS "cycle_states select" ON public.cycle_states;
DROP POLICY IF EXISTS "cycle_states insert" ON public.cycle_states;
DROP POLICY IF EXISTS "cycle_states update" ON public.cycle_states;
DROP POLICY IF EXISTS "cycle_states delete" ON public.cycle_states;

CREATE POLICY "cycle_states select"
  ON public.cycle_states FOR SELECT TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "cycle_states insert"
  ON public.cycle_states FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "cycle_states update"
  ON public.cycle_states FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  )
  WITH CHECK (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "cycle_states delete"
  ON public.cycle_states FOR DELETE TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

-- ─── CYCLE_ACTIONS ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view cycle_actions of their company" ON public.cycle_actions;
DROP POLICY IF EXISTS "Users can manage cycle_actions of their company" ON public.cycle_actions;
DROP POLICY IF EXISTS "cycle_actions select" ON public.cycle_actions;
DROP POLICY IF EXISTS "cycle_actions insert" ON public.cycle_actions;
DROP POLICY IF EXISTS "cycle_actions update" ON public.cycle_actions;
DROP POLICY IF EXISTS "cycle_actions delete" ON public.cycle_actions;

CREATE POLICY "cycle_actions select"
  ON public.cycle_actions FOR SELECT TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "cycle_actions insert"
  ON public.cycle_actions FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "cycle_actions update"
  ON public.cycle_actions FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  )
  WITH CHECK (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "cycle_actions delete"
  ON public.cycle_actions FOR DELETE TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

-- ─── RECORDS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view records of their company" ON public.records;
DROP POLICY IF EXISTS "Users can manage records of their company" ON public.records;
DROP POLICY IF EXISTS "records select" ON public.records;
DROP POLICY IF EXISTS "records insert" ON public.records;
DROP POLICY IF EXISTS "records update" ON public.records;
DROP POLICY IF EXISTS "records delete" ON public.records;

CREATE POLICY "records select"
  ON public.records FOR SELECT TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "records insert"
  ON public.records FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "records update"
  ON public.records FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  )
  WITH CHECK (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "records delete"
  ON public.records FOR DELETE TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );
