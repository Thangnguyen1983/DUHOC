ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hr_config jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.attendance_days ADD COLUMN IF NOT EXISTS check_in_method text;
ALTER TABLE public.attendance_days ADD COLUMN IF NOT EXISTS check_in_meta jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.attendance_days ADD COLUMN IF NOT EXISTS check_out_meta jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.attendance_days ADD COLUMN IF NOT EXISTS photo_path text;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS dependents integer NOT NULL DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS gross_pay numeric NOT NULL DEFAULT 0;