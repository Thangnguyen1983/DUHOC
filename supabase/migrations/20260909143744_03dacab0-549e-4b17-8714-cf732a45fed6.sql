ALTER TABLE public.student_document_checklist
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'dang_ky',
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS hard_copy_received boolean NOT NULL DEFAULT false;

ALTER TABLE public.student_document_checklist
  DROP CONSTRAINT IF EXISTS student_document_checklist_stage_check;
ALTER TABLE public.student_document_checklist
  ADD CONSTRAINT student_document_checklist_stage_check
  CHECK (stage IN ('dang_ky','dao_tao','visa','xuat_canh','sau_xuat_canh'));

ALTER TABLE public.catalog_document_types
  ADD COLUMN IF NOT EXISTS program_type text,
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'dang_ky',
  ADD COLUMN IF NOT EXISTS default_validity_months integer;

ALTER TABLE public.catalog_document_types
  DROP CONSTRAINT IF EXISTS catalog_document_types_stage_check;
ALTER TABLE public.catalog_document_types
  ADD CONSTRAINT catalog_document_types_stage_check
  CHECK (stage IN ('dang_ky','dao_tao','visa','xuat_canh','sau_xuat_canh'));
ALTER TABLE public.catalog_document_types
  DROP CONSTRAINT IF EXISTS catalog_document_types_program_type_check;
ALTER TABLE public.catalog_document_types
  ADD CONSTRAINT catalog_document_types_program_type_check
  CHECK (program_type IS NULL OR program_type IN ('du_hoc','xkld','thuc_tap_sinh'));

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS program_type text;
ALTER TABLE public.student_profiles
  DROP CONSTRAINT IF EXISTS student_profiles_program_type_check;
ALTER TABLE public.student_profiles
  ADD CONSTRAINT student_profiles_program_type_check
  CHECK (program_type IS NULL OR program_type IN ('du_hoc','xkld','thuc_tap_sinh'));

UPDATE public.student_profiles
SET program_type = CASE
  WHEN program ILIKE '%thực tập sinh%' OR program ILIKE '%thuc tap sinh%' OR program ILIKE '%tts%' THEN 'thuc_tap_sinh'
  WHEN program ILIKE '%xkl%' OR program ILIKE '%xuất khẩu lao động%' OR program ILIKE '%lao động%' THEN 'xkld'
  WHEN program ILIKE '%du h%' OR program ILIKE '%du_hoc%' THEN 'du_hoc'
  ELSE NULL
END
WHERE program_type IS NULL AND program IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_checklist_stage ON public.student_document_checklist (student_profile_id, stage);

CREATE OR REPLACE FUNCTION public.sync_student_checklist(_student_profile_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _market text;
  _program_type text;
  _count integer := 0;
BEGIN
  SELECT country, program_type INTO _market, _program_type
  FROM public.student_profiles WHERE id = _student_profile_id;

  INSERT INTO public.student_document_checklist
    (student_profile_id, doc_code, doc_name, market, is_required, sort_order, stage)
  SELECT _student_profile_id, dt.code, dt.name, dt.market, dt.is_required, dt.sort_order,
         COALESCE(dt.stage, 'dang_ky')
  FROM public.catalog_document_types dt
  WHERE dt.is_active = true
    AND (dt.market IS NULL OR (_market IS NOT NULL AND dt.market = _market))
    AND (dt.program_type IS NULL OR (_program_type IS NOT NULL AND dt.program_type = _program_type))
  ON CONFLICT (student_profile_id, doc_code) DO NOTHING;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$function$;