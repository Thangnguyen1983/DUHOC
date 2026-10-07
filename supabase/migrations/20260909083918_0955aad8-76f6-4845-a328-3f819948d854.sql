ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS id_type text,
  ADD COLUMN IF NOT EXISTS id_no text,
  ADD COLUMN IF NOT EXISTS id_issue_date date,
  ADD COLUMN IF NOT EXISTS id_issue_place text,
  ADD COLUMN IF NOT EXISTS id_expiry_date date,
  ADD COLUMN IF NOT EXISTS place_of_origin text,
  ADD COLUMN IF NOT EXISTS place_of_residence text,
  ADD COLUMN IF NOT EXISTS ocr_raw jsonb,
  ADD COLUMN IF NOT EXISTS ocr_at timestamptz;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;

CREATE INDEX IF NOT EXISTS idx_student_profiles_id_no ON public.student_profiles (id_no);