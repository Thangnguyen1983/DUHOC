REVOKE EXECUTE ON FUNCTION public.gen_student_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gen_student_code() TO service_role;