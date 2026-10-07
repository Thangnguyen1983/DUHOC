CREATE OR REPLACE FUNCTION public.notify_student_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed text := NULL;
  old_v text;
  new_v text;
  target uuid;
BEGIN
  IF NEW.current_status IS DISTINCT FROM OLD.current_status THEN
    changed := 'Trạng thái hồ sơ'; old_v := OLD.current_status; new_v := NEW.current_status;
  ELSIF NEW.visa_status IS DISTINCT FROM OLD.visa_status THEN
    changed := 'Trạng thái visa'; old_v := OLD.visa_status; new_v := NEW.visa_status;
  ELSIF NEW.departure_status IS DISTINCT FROM OLD.departure_status THEN
    changed := 'Trạng thái xuất cảnh'; old_v := OLD.departure_status; new_v := NEW.departure_status;
  ELSIF NEW.contract_status IS DISTINCT FROM OLD.contract_status THEN
    changed := 'Trạng thái hợp đồng'; old_v := OLD.contract_status; new_v := NEW.contract_status;
  END IF;

  IF changed IS NULL THEN
    RETURN NEW;
  END IF;

  target := COALESCE(NEW.assigned_to, OLD.assigned_to);
  IF target IS NOT NULL AND target IS DISTINCT FROM NEW.updated_by THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, meta)
    VALUES (
      target,
      'student_status',
      changed || ': ' || COALESCE(NEW.full_name, 'Học viên'),
      COALESCE(old_v, 'trống') || ' → ' || COALESCE(new_v, 'trống'),
      '/admin/students/' || NEW.id::text,
      jsonb_build_object('student_profile_id', NEW.id, 'field', changed)
    );
  END IF;

  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, meta)
    VALUES (
      NEW.user_id,
      'student_status',
      'Cập nhật hồ sơ của bạn: ' || changed,
      COALESCE(old_v, 'trống') || ' → ' || COALESCE(new_v, 'trống'),
      '/hoc-vien/ho-so',
      jsonb_build_object('student_profile_id', NEW.id, 'field', changed)
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_student_profile_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_student_profile_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_student_profile_change ON public.student_profiles;
CREATE TRIGGER trg_notify_student_profile_change
AFTER UPDATE ON public.student_profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_student_profile_change();

CREATE OR REPLACE FUNCTION public.notify_checklist_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE sp record;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status NOT IN ('submitted','rejected') THEN
    RETURN NEW;
  END IF;

  SELECT id, full_name, assigned_to INTO sp FROM public.student_profiles WHERE id = NEW.student_profile_id;
  IF sp.assigned_to IS NOT NULL AND sp.assigned_to IS DISTINCT FROM NEW.reviewed_by THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, meta)
    VALUES (
      sp.assigned_to,
      'checklist',
      CASE WHEN NEW.status = 'submitted' THEN 'Giấy tờ mới cần duyệt' ELSE 'Giấy tờ cần bổ sung' END,
      COALESCE(sp.full_name, 'Học viên') || ' — ' || NEW.doc_name,
      '/admin/students/' || sp.id::text,
      jsonb_build_object('student_profile_id', sp.id, 'doc_code', NEW.doc_code, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_checklist_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_checklist_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_checklist_change ON public.student_document_checklist;
CREATE TRIGGER trg_notify_checklist_change
AFTER UPDATE ON public.student_document_checklist
FOR EACH ROW EXECUTE FUNCTION public.notify_checklist_change();