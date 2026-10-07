CREATE OR REPLACE FUNCTION public.unaccent_simple(_t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT translate(
    lower(coalesce(_t, '')),
    'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ',
    repeat('a', 17) || repeat('e', 11) || repeat('i', 5) || repeat('o', 17) || repeat('u', 11) || repeat('y', 5) || 'd'
  );
$$;

CREATE OR REPLACE FUNCTION public.market_short_code(_market text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  m text := public.unaccent_simple(_market);
BEGIN
  IF m LIKE '%nhat%' OR m LIKE '%japan%' THEN RETURN 'JP';
  ELSIF m LIKE '%han quoc%' OR m LIKE '%han-quoc%' OR m LIKE '%korea%' THEN RETURN 'KR';
  ELSIF m LIKE '%dai loan%' OR m LIKE '%dai-loan%' OR m LIKE '%taiwan%' THEN RETURN 'TW';
  ELSIF m LIKE '%duc%' OR m LIKE '%german%' THEN RETURN 'DE';
  ELSIF m LIKE '%ba lan%' OR m LIKE '%ba-lan%' OR m LIKE '%poland%' THEN RETURN 'PL';
  ELSIF m LIKE '%hungar%' THEN RETURN 'HU';
  ELSIF m LIKE '%romania%' THEN RETURN 'RO';
  ELSIF m LIKE '%slovakia%' THEN RETURN 'SK';
  ELSIF m LIKE '%canada%' THEN RETURN 'CA';
  ELSIF m LIKE '%australia%' OR m = 'uc' THEN RETURN 'AU';
  ELSE RETURN 'XX';
  END IF;
END;
$$;

UPDATE public.departure_records
SET dossier_code = public.market_short_code(destination_country)
      || substr(dossier_code, position('-' in dossier_code))
WHERE dossier_code IS NOT NULL
  AND split_part(dossier_code, '-', 1) <> public.market_short_code(destination_country);