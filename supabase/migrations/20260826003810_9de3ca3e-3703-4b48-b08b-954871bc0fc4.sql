CREATE TABLE IF NOT EXISTS public.student_document_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  doc_code text NOT NULL,
  doc_name text NOT NULL,
  market text,
  is_required boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'missing',
  note text,
  document_id uuid REFERENCES public.student_documents(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_document_checklist_status_chk CHECK (status IN ('missing','submitted','verified','rejected','na')),
  CONSTRAINT student_document_checklist_unique UNIQUE (student_profile_id, doc_code)
);

CREATE INDEX IF NOT EXISTS idx_sdc_student ON public.student_document_checklist(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_sdc_status ON public.student_document_checklist(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_document_checklist TO authenticated;
GRANT ALL ON public.student_document_checklist TO service_role;

ALTER TABLE public.student_document_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view checklist"
ON public.student_document_checklist FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'cskh')
  OR public.has_role(auth.uid(),'visa_officer') OR public.has_role(auth.uid(),'departure_coordinator')
  OR public.has_role(auth.uid(),'market_head')
  OR EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = student_document_checklist.student_profile_id AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can insert checklist"
ON public.student_document_checklist FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'cskh')
  OR public.has_role(auth.uid(),'visa_officer') OR public.has_role(auth.uid(),'departure_coordinator')
  OR public.has_role(auth.uid(),'market_head')
);

CREATE POLICY "Staff can update checklist"
ON public.student_document_checklist FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'cskh')
  OR public.has_role(auth.uid(),'visa_officer') OR public.has_role(auth.uid(),'departure_coordinator')
  OR public.has_role(auth.uid(),'market_head')
);

CREATE POLICY "Admins can delete checklist"
ON public.student_document_checklist FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

CREATE TRIGGER trg_sdc_updated_at BEFORE UPDATE ON public.student_document_checklist
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_student_checklist(_student_profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _market text;
  _count integer := 0;
BEGIN
  SELECT country INTO _market FROM public.student_profiles WHERE id = _student_profile_id;

  INSERT INTO public.student_document_checklist
    (student_profile_id, doc_code, doc_name, market, is_required, sort_order)
  SELECT _student_profile_id, dt.code, dt.name, dt.market, dt.is_required, dt.sort_order
  FROM public.catalog_document_types dt
  WHERE dt.is_active = true
    AND (dt.market IS NULL OR (_market IS NOT NULL AND dt.market = _market))
  ON CONFLICT (student_profile_id, doc_code) DO NOTHING;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_student_checklist(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_student_checklist(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.on_student_profile_create_checklist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_student_checklist(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_student_profile_checklist ON public.student_profiles;
CREATE TRIGGER trg_student_profile_checklist
AFTER INSERT ON public.student_profiles
FOR EACH ROW EXECUTE FUNCTION public.on_student_profile_create_checklist();

ALTER PUBLICATION supabase_realtime ADD TABLE public.student_document_checklist;
ALTER TABLE public.student_document_checklist REPLICA IDENTITY FULL;