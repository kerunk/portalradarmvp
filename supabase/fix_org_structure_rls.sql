-- ============================================================
-- FIX: RLS for org_structure + diagnóstico do vínculo do usuário
-- Rode estes comandos no SQL Editor do Supabase.
-- ============================================================

-- 1) DIAGNÓSTICO — descubra o auth.uid() do usuário logado e o vínculo no profiles
-- Substitua pelo email do usuário cliente afetado:
SELECT u.id AS auth_uid, u.email, p.company_id, p.full_name,
       (SELECT array_agg(role) FROM public.user_roles WHERE user_id = u.id) AS roles
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'lucas@lucas.com';   -- <-- ajuste o email aqui

-- 2) Se company_id estiver NULL ou diferente, vincule o usuário à empresa correta:
-- UPDATE public.profiles
--   SET company_id = '64576ea2-cfa0-4f18-a343-6538da71a181'
-- WHERE id = '<auth_uid_do_passo_1>';

-- 3) (Opcional, recomendado) Recrie as policies usando uma função SECURITY DEFINER
--    que evita problemas de visibilidade do profiles via RLS.

CREATE OR REPLACE FUNCTION public.user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Substitui as policies do org_structure
DROP POLICY IF EXISTS "Users can view org structure of their company" ON public.org_structure;
DROP POLICY IF EXISTS "Users can manage org structure of their company" ON public.org_structure;

CREATE POLICY "org_structure select"
  ON public.org_structure FOR SELECT TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "org_structure insert"
  ON public.org_structure FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "org_structure update"
  ON public.org_structure FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  )
  WITH CHECK (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );

CREATE POLICY "org_structure delete"
  ON public.org_structure FOR DELETE TO authenticated
  USING (
    company_id = public.user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin_mvp')
  );
