CREATE TABLE public.orientation_certificate_counters (
  market_code text NOT NULL,
  year integer NOT NULL,
  last_no integer NOT NULL DEFAULT 0,
  PRIMARY KEY (market_code, year)
);
GRANT ALL ON public.orientation_certificate_counters TO service_role;
ALTER TABLE public.orientation_certificate_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_orientation_certificate_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ptype text; _pmarket text; _country text; _mc text; _yr int; _no int;
BEGIN
  IF NEW.program_id IS NULL THEN RETURN NEW; END IF;
  SELECT program_type, market INTO _ptype, _pmarket FROM training_programs WHERE id = NEW.program_id;
  IF _ptype IS DISTINCT FROM 'orientation' THEN RETURN NEW; END IF;
  IF NEW.certificate_number LIKE 'KZ-GDĐH-%' THEN RETURN NEW; END IF;
  SELECT country INTO _country FROM student_profiles WHERE id = NEW.student_profile_id;
  _mc := public.market_short_code(coalesce(nullif(_country, ''), _pmarket, ''));
  _yr := extract(year FROM coalesce(NEW.issued_at, now()))::int;
  INSERT INTO orientation_certificate_counters(market_code, year, last_no) VALUES (_mc, _yr, 1)
  ON CONFLICT (market_code, year) DO UPDATE SET last_no = orientation_certificate_counters.last_no + 1
  RETURNING last_no INTO _no;
  NEW.meta := coalesce(NEW.meta, '{}'::jsonb) || jsonb_build_object('legacy_number', NEW.certificate_number);
  NEW.certificate_number := 'KZ-GDĐH-' || _mc || '-' || _yr || '-' || lpad(_no::text, 5, '0');
  RETURN NEW;
END $$;

CREATE TRIGGER trg_orientation_certificate_number
BEFORE INSERT ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.set_orientation_certificate_number();