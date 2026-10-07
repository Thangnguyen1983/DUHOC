-- 1. Phòng ban: bổ sung loại hình nghiệp vụ
ALTER TABLE public.catalog_departments
  ADD COLUMN IF NOT EXISTS program_type text;

COMMENT ON COLUMN public.catalog_departments.program_type IS 'Loại hình nghiệp vụ: du_hoc | xkld | dao_tao | ho_tro';

-- 2. Hồ sơ CBNV: mỗi tài khoản chỉ một hồ sơ
CREATE UNIQUE INDEX IF NOT EXISTS staff_profiles_user_id_key
  ON public.staff_profiles (user_id);

-- 3. Hồ sơ xuất cảnh: mã hồ sơ theo quy tắc mới
ALTER TABLE public.departure_records
  ADD COLUMN IF NOT EXISTS dossier_code text,
  ADD COLUMN IF NOT EXISTS program_type text,
  ADD COLUMN IF NOT EXISTS contract_type text;

COMMENT ON COLUMN public.departure_records.dossier_code IS 'Mã hồ sơ xuất cảnh: [THỊ TRƯỜNG]-[DH/LD]-[HD/TV]-[YYMM]-[STT 5 số]';
COMMENT ON COLUMN public.departure_records.program_type IS 'DH = du học, LD = lao động';
COMMENT ON COLUMN public.departure_records.contract_type IS 'HD = hợp đồng, TV = tư vấn';

CREATE UNIQUE INDEX IF NOT EXISTS departure_records_dossier_code_key
  ON public.departure_records (dossier_code) WHERE dossier_code IS NOT NULL;

-- 4. Mã ngắn thị trường
CREATE OR REPLACE FUNCTION public.market_short_code(_market text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  m text := lower(unaccent_simple(coalesce(_market, '')));
BEGIN
  IF m LIKE '%nhat%' OR m LIKE '%japan%' THEN RETURN 'JP';
  ELSIF m LIKE '%han%' OR m LIKE '%korea%' THEN RETURN 'KR';
  ELSIF m LIKE '%dai loan%' OR m LIKE '%dai-loan%' OR m LIKE '%taiwan%' THEN RETURN 'TW';
  ELSIF m LIKE '%duc%' OR m LIKE '%german%' THEN RETURN 'DE';
  ELSIF m LIKE '%ba lan%' OR m LIKE '%ba-lan%' OR m LIKE '%poland%' THEN RETURN 'PL';
  ELSIF m LIKE '%hungary%' OR m LIKE '%hungari%' THEN RETURN 'HU';
  ELSIF m LIKE '%romania%' THEN RETURN 'RO';
  ELSIF m LIKE '%slovakia%' THEN RETURN 'SK';
  ELSIF m LIKE '%canada%' THEN RETURN 'CA';
  ELSIF m LIKE '%uc%' OR m LIKE '%australia%' THEN RETURN 'AU';
  ELSE RETURN 'XX';
  END IF;
END;
$$;

-- Chuẩn hoá chuỗi tiếng Việt về không dấu (không cần extension)
CREATE OR REPLACE FUNCTION public.unaccent_simple(_t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT translate(
    lower(coalesce(_t, '')),
    'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ',
    'aaaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
  );
$$;

-- 5. Sinh mã hồ sơ đầy đủ
CREATE OR REPLACE FUNCTION public.gen_departure_dossier_code_v2(
  _market text,
  _program_type text,
  _contract_type text,
  _ref_date date DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  seq int := nextval('public.dossier_code_seq');
  mk text := public.market_short_code(_market);
  pt text := upper(coalesce(nullif(trim(_program_type), ''), 'LD'));
  ct text := upper(coalesce(nullif(trim(_contract_type), ''), 'HD'));
  d date := coalesce(_ref_date, current_date);
BEGIN
  IF pt NOT IN ('DH', 'LD') THEN pt := 'LD'; END IF;
  IF ct NOT IN ('HD', 'TV') THEN ct := 'HD'; END IF;
  RETURN mk || '-' || pt || '-' || ct || '-' || to_char(d, 'YYMM') || '-' || lpad(seq::text, 5, '0');
END;
$$;

-- 6. Tự cấp mã khi tạo hồ sơ xuất cảnh
CREATE OR REPLACE FUNCTION public.set_departure_dossier_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.dossier_code IS NULL OR trim(NEW.dossier_code) = '' THEN
    NEW.dossier_code := public.gen_departure_dossier_code_v2(
      NEW.destination_country,
      NEW.program_type,
      NEW.contract_type,
      coalesce(NEW.planned_departure_date, NEW.actual_departure_date, current_date)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_departure_dossier_code ON public.departure_records;
CREATE TRIGGER trg_set_departure_dossier_code
  BEFORE INSERT ON public.departure_records
  FOR EACH ROW EXECUTE FUNCTION public.set_departure_dossier_code();

-- 7. Cấp mã cho các hồ sơ đã có
UPDATE public.departure_records
SET dossier_code = public.gen_departure_dossier_code_v2(
      destination_country,
      coalesce(program_type, 'LD'),
      coalesce(contract_type, 'HD'),
      coalesce(planned_departure_date, actual_departure_date, current_date)
    )
WHERE dossier_code IS NULL;