
CREATE OR REPLACE FUNCTION public.on_consultation_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE new_profile_id uuid;
BEGIN
  IF NEW.status IN ('contacted','qualified','converted','done')
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.student_profile_id IS NULL
  THEN
    INSERT INTO public.student_profiles (
      consultation_id, full_name, phone, email, program, country, current_status, meta
    ) VALUES (
      NEW.id, NEW.full_name, NEW.phone, NEW.email, NEW.program, NEW.market,
      'lead_contacted',
      jsonb_build_object('source', NEW.source, 'message', NEW.message, 'lead_status', NEW.status)
    ) RETURNING id INTO new_profile_id;
    NEW.student_profile_id := new_profile_id;
    INSERT INTO public.student_status_history (student_profile_id, from_status, to_status, note)
    VALUES (
      new_profile_id, NULL, 'lead_contacted',
      'Tự động tạo hồ sơ HV từ Lead (trạng thái: ' || NEW.status || ')'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Backfill: tạo hồ sơ cho các Lead đã ở trạng thái hoàn tất/quan tâm nhưng chưa gắn profile.
-- Dùng UPDATE re-set status để trigger BEFORE UPDATE chạy đúng luồng có sẵn.
UPDATE public.consultations
SET status = status
WHERE status IN ('contacted','qualified','converted','done')
  AND student_profile_id IS NULL;
