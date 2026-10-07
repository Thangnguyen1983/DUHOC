ALTER TABLE public.training_programs ADD COLUMN IF NOT EXISTS program_type text;
ALTER TABLE public.training_classes ADD COLUMN IF NOT EXISTS cohort text;
ALTER TABLE public.training_classes ADD COLUMN IF NOT EXISTS market text;

UPDATE public.training_programs
SET program_type = CASE
  WHEN language IS NOT NULL AND length(trim(language)) > 0 THEN 'language'
  WHEN name ILIKE '%nghề%' OR name ILIKE '%nghe %' OR code ILIKE 'NGHE%' THEN 'vocational'
  WHEN name ILIKE '%định hướng%' OR name ILIKE '%dinh huong%' THEN 'orientation'
  ELSE 'other'
END
WHERE program_type IS NULL;

UPDATE public.training_classes c
SET market = p.market
FROM public.training_programs p
WHERE c.program_id = p.id AND c.market IS NULL AND p.market IS NOT NULL;

UPDATE public.training_classes
SET cohort = to_char(start_date, 'YYYY-MM')
WHERE cohort IS NULL AND start_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_programs_type ON public.training_programs (program_type);
CREATE INDEX IF NOT EXISTS idx_training_classes_market ON public.training_classes (market);
CREATE INDEX IF NOT EXISTS idx_training_classes_cohort ON public.training_classes (cohort);
CREATE INDEX IF NOT EXISTS idx_training_classes_status ON public.training_classes (status);
CREATE INDEX IF NOT EXISTS idx_training_classes_program ON public.training_classes (program_id);
CREATE INDEX IF NOT EXISTS idx_training_classes_teacher ON public.training_classes (teacher_id);
CREATE INDEX IF NOT EXISTS idx_training_classes_start_date ON public.training_classes (start_date);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_class_status ON public.training_enrollments (class_id, status);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_student ON public.training_enrollments (student_profile_id);