
-- 1) Mở rộng student_profiles
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS contract_status text,
  ADD COLUMN IF NOT EXISTS visa_status text,
  ADD COLUMN IF NOT EXISTS departure_status text,
  ADD COLUMN IF NOT EXISTS post_departure_status text;

-- Backfill source từ consultations
UPDATE public.student_profiles sp
SET source = c.source
FROM public.consultations c
WHERE sp.consultation_id = c.id AND sp.source IS NULL;

-- 2) Hàng đợi cấp tài khoản Portal
CREATE TABLE IF NOT EXISTS public.account_provision_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  status text NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_apq_status ON public.account_provision_queue(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_provision_queue TO authenticated;
GRANT ALL ON public.account_provision_queue TO service_role;
ALTER TABLE public.account_provision_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage queue" ON public.account_provision_queue;
CREATE POLICY "Admin manage queue" ON public.account_provision_queue
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_apq_updated_at BEFORE UPDATE ON public.account_provision_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Trigger enqueue khi xếp lớp
CREATE OR REPLACE FUNCTION public.enqueue_account_on_enroll()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sp record;
BEGIN
  SELECT user_id, email, full_name INTO sp FROM public.student_profiles WHERE id = NEW.student_profile_id;
  IF sp.user_id IS NULL AND sp.email IS NOT NULL AND sp.email <> '' THEN
    INSERT INTO public.account_provision_queue (student_profile_id, email, full_name)
    VALUES (NEW.student_profile_id, sp.email, sp.full_name);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enqueue_account ON public.training_enrollments;
CREATE TRIGGER trg_enqueue_account
AFTER INSERT ON public.training_enrollments
FOR EACH ROW EXECUTE FUNCTION public.enqueue_account_on_enroll();

-- 4) RLS gia cố cho học viên/giáo viên

-- Học viên xem doc đã verify của chính mình
DROP POLICY IF EXISTS "Student read own documents" ON public.student_documents;
CREATE POLICY "Student read own documents" ON public.student_documents
  FOR SELECT TO authenticated
  USING (verified = true AND EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = student_documents.student_profile_id AND sp.user_id = auth.uid()
  ));

-- Học viên xem workflow instance của chính mình
DROP POLICY IF EXISTS "Student read own workflow" ON public.workflow_instances;
CREATE POLICY "Student read own workflow" ON public.workflow_instances
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = workflow_instances.student_profile_id AND sp.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Student read own workflow logs" ON public.workflow_step_logs;
CREATE POLICY "Student read own workflow logs" ON public.workflow_step_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = workflow_step_logs.student_profile_id AND sp.user_id = auth.uid()
  ));

-- Học viên xem status history của chính mình
DROP POLICY IF EXISTS "Student read own status history" ON public.student_status_history;
CREATE POLICY "Student read own status history" ON public.student_status_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = student_status_history.student_profile_id AND sp.user_id = auth.uid()
  ));

-- Học viên xem hồ sơ của chính mình
DROP POLICY IF EXISTS "Student read own profile" ON public.student_profiles;
CREATE POLICY "Student read own profile" ON public.student_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Giáo viên xem lớp được phân
DROP POLICY IF EXISTS "Teacher read assigned classes" ON public.training_classes;
CREATE POLICY "Teacher read assigned classes" ON public.training_classes
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(),'training_manager') OR public.has_role(auth.uid(),'admin'));
