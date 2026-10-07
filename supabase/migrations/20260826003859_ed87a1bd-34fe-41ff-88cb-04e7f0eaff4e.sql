REVOKE ALL ON FUNCTION public.sync_student_checklist(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_student_checklist(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.on_student_profile_create_checklist() FROM PUBLIC, anon, authenticated;