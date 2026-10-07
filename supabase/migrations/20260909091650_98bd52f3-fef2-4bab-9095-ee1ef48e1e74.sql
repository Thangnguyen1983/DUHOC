CREATE TABLE public.student_export_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  exported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  exported_by_email text,
  format text NOT NULL,
  purpose text NOT NULL,
  note text,
  file_name text NOT NULL,
  checksum text,
  byte_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_export_logs_profile ON public.student_export_logs (student_profile_id, created_at DESC);

GRANT SELECT, INSERT ON public.student_export_logs TO authenticated;
GRANT ALL ON public.student_export_logs TO service_role;

ALTER TABLE public.student_export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view export logs"
ON public.student_export_logs FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'consultant')
  OR public.has_role(auth.uid(), 'visa_officer')
  OR public.has_role(auth.uid(), 'departure_coordinator')
  OR public.has_role(auth.uid(), 'cskh')
);

CREATE POLICY "Staff can insert export logs"
ON public.student_export_logs FOR INSERT TO authenticated
WITH CHECK (
  exported_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'training_manager')
    OR public.has_role(auth.uid(), 'consultant')
    OR public.has_role(auth.uid(), 'visa_officer')
    OR public.has_role(auth.uid(), 'departure_coordinator')
    OR public.has_role(auth.uid(), 'cskh')
  )
);