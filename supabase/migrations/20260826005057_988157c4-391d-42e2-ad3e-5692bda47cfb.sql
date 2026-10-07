CREATE TABLE public.student_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.training_classes(id) ON DELETE SET NULL,
  teacher_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  period_type text NOT NULL DEFAULT 'week',
  period_label text NOT NULL,
  period_start date,
  period_end date,
  attendance_score numeric(4,1),
  attitude_score numeric(4,1),
  progress_score numeric(4,1),
  speaking_score numeric(4,1),
  overall_score numeric(4,1),
  comment text,
  recommendation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_reviews_student ON public.student_reviews(student_profile_id);
CREATE INDEX idx_student_reviews_class ON public.student_reviews(class_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_reviews TO authenticated;
GRANT ALL ON public.student_reviews TO service_role;
ALTER TABLE public.student_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage student reviews" ON public.student_reviews
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'training_staff')
  OR public.has_role(auth.uid(), 'market_head')
  OR public.has_role(auth.uid(), 'teacher')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'training_staff')
  OR public.has_role(auth.uid(), 'market_head')
  OR public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Students view own reviews" ON public.student_reviews
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = student_reviews.student_profile_id AND sp.user_id = auth.uid()
  )
);

CREATE TRIGGER trg_student_reviews_updated
BEFORE UPDATE ON public.student_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.student_conduct_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.training_classes(id) ON DELETE SET NULL,
  record_type text NOT NULL DEFAULT 'reminder',
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  detail text,
  auto_generated boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conduct_student ON public.student_conduct_records(student_profile_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_conduct_records TO authenticated;
GRANT ALL ON public.student_conduct_records TO service_role;
ALTER TABLE public.student_conduct_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage conduct records" ON public.student_conduct_records
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'training_staff')
  OR public.has_role(auth.uid(), 'market_head')
  OR public.has_role(auth.uid(), 'teacher')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'training_staff')
  OR public.has_role(auth.uid(), 'market_head')
  OR public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Students view own conduct records" ON public.student_conduct_records
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = student_conduct_records.student_profile_id AND sp.user_id = auth.uid()
  )
);