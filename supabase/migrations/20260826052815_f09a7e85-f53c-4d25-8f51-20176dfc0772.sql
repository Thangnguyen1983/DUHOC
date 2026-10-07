-- 1. Normalize market slugs
UPDATE public.student_profiles SET country = CASE lower(btrim(country))
  WHEN 'germany' THEN 'duc'
  WHEN 'đức' THEN 'duc'
  WHEN 'japan' THEN 'nhat-ban'
  WHEN 'nhật bản' THEN 'nhat-ban'
  WHEN 'taiwan' THEN 'dai-loan'
  WHEN 'đài loan' THEN 'dai-loan'
  WHEN 'china' THEN 'trung-quoc'
  WHEN 'trung quốc' THEN 'trung-quoc'
  WHEN 'korea' THEN 'han-quoc'
  WHEN 'south korea' THEN 'han-quoc'
  WHEN 'hàn quốc' THEN 'han-quoc'
  WHEN 'poland' THEN 'ba-lan'
  ELSE lower(btrim(country)) END
WHERE country IS NOT NULL;

UPDATE public.consultations SET market = CASE lower(btrim(market))
  WHEN 'germany' THEN 'duc'
  WHEN 'đức' THEN 'duc'
  WHEN 'japan' THEN 'nhat-ban'
  WHEN 'nhật bản' THEN 'nhat-ban'
  WHEN 'taiwan' THEN 'dai-loan'
  WHEN 'đài loan' THEN 'dai-loan'
  WHEN 'china' THEN 'trung-quoc'
  WHEN 'trung quốc' THEN 'trung-quoc'
  WHEN 'korea' THEN 'han-quoc'
  WHEN 'south korea' THEN 'han-quoc'
  WHEN 'hàn quốc' THEN 'han-quoc'
  WHEN 'poland' THEN 'ba-lan'
  ELSE lower(btrim(market)) END
WHERE market IS NOT NULL;

-- 2. Extra market document types
INSERT INTO public.catalog_document_types (code, name, market, is_required, sort_order, is_active)
VALUES
  ('coe_nhat_ban', 'Giấy chứng nhận tư cách lưu trú (COE)', 'nhat-ban', true, 20, true),
  ('giay_bao_lanh', 'Giấy bảo lãnh / Hợp đồng tiếp nhận', 'nhat-ban', true, 21, true),
  ('jw202', 'Giấy nhập học JW202', 'trung-quoc', true, 20, true)
ON CONFLICT DO NOTHING;

-- 3. Backfill checklist for all existing students
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.student_profiles WHERE deleted_at IS NULL LOOP
    PERFORM public.sync_student_checklist(r.id);
  END LOOP;
END $$;