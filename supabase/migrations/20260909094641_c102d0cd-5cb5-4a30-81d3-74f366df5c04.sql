ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS destination_country text,
  ADD COLUMN IF NOT EXISTS destination_city text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS employer_name text,
  ADD COLUMN IF NOT EXISTS work_address text,
  ADD COLUMN IF NOT EXISTS employer_contact_name text,
  ADD COLUMN IF NOT EXISTS employer_contact_phone text,
  ADD COLUMN IF NOT EXISTS employer_contact_email text,
  ADD COLUMN IF NOT EXISTS contract_start_date date,
  ADD COLUMN IF NOT EXISTS contract_end_date date,
  ADD COLUMN IF NOT EXISTS contract_duration_months integer,
  ADD COLUMN IF NOT EXISTS contract_renewal_note text,
  ADD COLUMN IF NOT EXISTS departure_date date,
  ADD COLUMN IF NOT EXISTS contract_alert_sent jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_student_profiles_contract_end ON public.student_profiles (contract_end_date) WHERE contract_end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_profiles_employer ON public.student_profiles (employer_name);

CREATE OR REPLACE FUNCTION public.notify_contract_expiry()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  milestone text;
  days_left integer;
  target uuid;
  sent integer := 0;
BEGIN
  FOR r IN
    SELECT id, full_name, assigned_to, contract_end_date, contract_alert_sent, employer_name
    FROM public.student_profiles
    WHERE deleted_at IS NULL
      AND contract_end_date IS NOT NULL
      AND contract_end_date <= (CURRENT_DATE + 90)
  LOOP
    days_left := r.contract_end_date - CURRENT_DATE;
    milestone := CASE
      WHEN days_left < 0 THEN 'overdue'
      WHEN days_left <= 7 THEN 'd7'
      WHEN days_left <= 30 THEN 'd30'
      ELSE 'd90'
    END;

    IF (r.contract_alert_sent ? milestone) THEN
      CONTINUE;
    END IF;

    target := r.assigned_to;
    IF target IS NULL THEN
      SELECT user_id INTO target FROM public.user_roles WHERE role = 'admin'::app_role ORDER BY created_at LIMIT 1;
    END IF;

    IF target IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link, meta)
      VALUES (
        target,
        'contract_expiry',
        CASE
          WHEN milestone = 'overdue' THEN 'Hợp đồng đã quá hạn: ' || COALESCE(r.full_name, 'Học viên')
          ELSE 'Hợp đồng sắp hết hạn (' || days_left || ' ngày): ' || COALESCE(r.full_name, 'Học viên')
        END,
        COALESCE(r.employer_name, 'Chưa có đơn vị tiếp nhận') || ' — hết hạn ngày ' || to_char(r.contract_end_date, 'DD/MM/YYYY'),
        '/admin/students/' || r.id::text,
        jsonb_build_object('student_profile_id', r.id, 'milestone', milestone, 'days_left', days_left)
      );
      sent := sent + 1;
    END IF;

    UPDATE public.student_profiles
    SET contract_alert_sent = COALESCE(contract_alert_sent, '{}'::jsonb) || jsonb_build_object(milestone, now())
    WHERE id = r.id;
  END LOOP;

  RETURN sent;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_contract_expiry() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_contract_expiry() TO service_role;

SELECT cron.schedule('notify-contract-expiry', '0 1 * * *', $cron$ SELECT public.notify_contract_expiry(); $cron$);