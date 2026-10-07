-- 1) Identity locking on student_profiles
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS student_code text;

CREATE OR REPLACE FUNCTION public.gen_student_code()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 'KZ' || to_char(now(), 'YY') || lpad((floor(random()*1000000))::int::text, 6, '0')
$$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.student_profiles WHERE student_code IS NULL LOOP
    LOOP
      BEGIN
        UPDATE public.student_profiles SET student_code = public.gen_student_code() WHERE id = r.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END LOOP;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS student_profiles_student_code_key
  ON public.student_profiles (student_code);
CREATE UNIQUE INDEX IF NOT EXISTS student_profiles_user_id_key
  ON public.student_profiles (user_id) WHERE user_id IS NOT NULL;

-- audit log of profile <-> account links
CREATE TABLE IF NOT EXISTS public.student_account_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  linked_by uuid,
  method text NOT NULL DEFAULT 'email_match',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.student_account_links TO authenticated;
GRANT ALL ON public.student_account_links TO service_role;
ALTER TABLE public.student_account_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read account links" ON public.student_account_links
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'training_manager') OR public.has_role(auth.uid(), 'training_staff'));

-- 2) Attendance evidence columns
ALTER TABLE public.training_attendance
  ADD COLUMN IF NOT EXISTS check_in_method text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS device_info jsonb,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS pending boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.attendance_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.training_enrollments(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  method text NOT NULL DEFAULT 'manual',
  reason text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.attendance_change_log TO authenticated;
GRANT ALL ON public.attendance_change_log TO service_role;
ALTER TABLE public.attendance_change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read attendance log" ON public.attendance_change_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'training_manager') OR public.has_role(auth.uid(), 'training_staff') OR public.has_role(auth.uid(), 'teacher'));

-- 3) QR attendance sessions
CREATE TABLE IF NOT EXISTS public.attendance_qr_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  secret text NOT NULL,
  opened_by uuid,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  late_after_minutes integer NOT NULL DEFAULT 15,
  require_approval boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS attendance_qr_sessions_open_key
  ON public.attendance_qr_sessions (session_id) WHERE closed_at IS NULL;
GRANT ALL ON public.attendance_qr_sessions TO service_role;
ALTER TABLE public.attendance_qr_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read qr sessions" ON public.attendance_qr_sessions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'training_manager') OR public.has_role(auth.uid(), 'teacher'));
CREATE TRIGGER trg_attendance_qr_sessions_updated
  BEFORE UPDATE ON public.attendance_qr_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Recurring schedule config lives in training_classes.meta (jsonb) — ensure default
ALTER TABLE public.training_classes ALTER COLUMN meta SET DEFAULT '{}'::jsonb;
UPDATE public.training_classes SET meta = '{}'::jsonb WHERE meta IS NULL;