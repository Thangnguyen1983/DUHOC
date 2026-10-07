
-- Tighten consultation insert (length checks instead of plain TRUE)
DROP POLICY IF EXISTS "Anyone can submit consultation" ON public.consultations;
CREATE POLICY "Anyone can submit consultation" ON public.consultations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(full_name) BETWEEN 2 AND 120
    AND length(phone) BETWEEN 8 AND 20
    AND (email IS NULL OR length(email) <= 200)
    AND length(program) BETWEEN 1 AND 50
    AND (market IS NULL OR length(market) <= 50)
    AND (message IS NULL OR length(message) <= 2000)
  );

-- Lock down SECURITY DEFINER functions: only allow expected callers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
