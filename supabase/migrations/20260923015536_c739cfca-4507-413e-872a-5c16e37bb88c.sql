-- 1. catalog_departments: chức năng / thị trường phụ trách
ALTER TABLE public.catalog_departments
  ADD COLUMN IF NOT EXISTS market_code text,
  ADD COLUMN IF NOT EXISTS function_note text;

-- 2. Bộ đếm liên tục toàn hệ thống cho mã hồ sơ xuất cảnh
CREATE SEQUENCE IF NOT EXISTS public.dossier_code_seq START 1;

-- 3. Hàm sinh mã hồ sơ xuất cảnh: THITRUONG-LOAIHD-YYMM-STT (STT liên tục toàn hệ thống)
CREATE OR REPLACE FUNCTION public.gen_departure_dossier_code(_market text, _contract_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq int := nextval('public.dossier_code_seq');
  mk text := upper(coalesce(nullif(trim(_market), ''), 'XX'));
  ct text := upper(coalesce(nullif(trim(_contract_type), ''), 'LD'));
BEGIN
  RETURN mk || '-' || ct || '-' || to_char(now(), 'YYMM') || '-' || lpad(seq::text, 5, '0');
END;
$$;
REVOKE ALL ON FUNCTION public.gen_departure_dossier_code(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gen_departure_dossier_code(text, text) TO service_role;

-- 4. Hồ sơ CBNV mở rộng
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  id_no text,
  dob date,
  phone text,
  education_level text,
  pro_certificate_du_hoc text,
  pro_certificate_xkld text,
  department_id uuid REFERENCES public.catalog_departments(id),
  job_title_id uuid REFERENCES public.catalog_job_titles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_profiles TO authenticated;
GRANT ALL ON public.staff_profiles TO service_role;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_profiles_select ON public.staff_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY staff_profiles_write ON public.staff_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Phân công phạm vi phòng ban + 3 mức quyền
CREATE TABLE IF NOT EXISTS public.staff_department_scope (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  department_id uuid NOT NULL REFERENCES public.catalog_departments(id),
  access_level text NOT NULL DEFAULT 'read',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, department_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_department_scope TO authenticated;
GRANT ALL ON public.staff_department_scope TO service_role;
ALTER TABLE public.staff_department_scope ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_select ON public.staff_department_scope FOR SELECT TO authenticated USING (true);
CREATE POLICY scope_write ON public.staff_department_scope FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Trigger updated_at cho 2 bảng mới
CREATE TRIGGER trg_staff_profiles_updated_at BEFORE UPDATE ON public.staff_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_scope_updated_at BEFORE UPDATE ON public.staff_department_scope FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();