CREATE OR REPLACE FUNCTION public.set_student_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.student_code IS NULL OR btrim(NEW.student_code) = '' THEN
    NEW.student_code := public.gen_student_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_student_profiles_set_code ON public.student_profiles;
CREATE TRIGGER trg_student_profiles_set_code
BEFORE INSERT ON public.student_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_student_code();

UPDATE public.student_profiles
SET student_code = public.gen_student_code()
WHERE student_code IS NULL OR btrim(student_code) = '';