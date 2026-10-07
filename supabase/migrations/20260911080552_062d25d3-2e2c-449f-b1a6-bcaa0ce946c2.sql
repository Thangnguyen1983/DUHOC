ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS origin_province_code text,
  ADD COLUMN IF NOT EXISTS origin_province_name text,
  ADD COLUMN IF NOT EXISTS origin_ward_code text,
  ADD COLUMN IF NOT EXISTS origin_ward_name text,
  ADD COLUMN IF NOT EXISTS origin_address_detail text,
  ADD COLUMN IF NOT EXISTS residence_province_code text,
  ADD COLUMN IF NOT EXISTS residence_province_name text,
  ADD COLUMN IF NOT EXISTS residence_ward_code text,
  ADD COLUMN IF NOT EXISTS residence_ward_name text,
  ADD COLUMN IF NOT EXISTS residence_address_detail text,
  ADD COLUMN IF NOT EXISTS current_province_code text,
  ADD COLUMN IF NOT EXISTS current_province_name text,
  ADD COLUMN IF NOT EXISTS current_ward_code text,
  ADD COLUMN IF NOT EXISTS current_ward_name text,
  ADD COLUMN IF NOT EXISTS current_address_detail text;

CREATE INDEX IF NOT EXISTS idx_student_profiles_residence_province
  ON public.student_profiles (residence_province_code);
CREATE INDEX IF NOT EXISTS idx_student_profiles_origin_province
  ON public.student_profiles (origin_province_code);