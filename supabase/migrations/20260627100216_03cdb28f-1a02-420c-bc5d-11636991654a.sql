
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS student_profile_id uuid;

CREATE TABLE public.student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  dob date,
  country text,
  program text,
  current_status text NOT NULL DEFAULT 'lead_contacted',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz
);
CREATE INDEX student_profiles_user_id_idx ON public.student_profiles(user_id);
CREATE INDEX student_profiles_consultation_id_idx ON public.student_profiles(consultation_id);
CREATE INDEX student_profiles_assigned_to_idx ON public.student_profiles(assigned_to);
CREATE INDEX student_profiles_current_status_idx ON public.student_profiles(current_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view student profiles" ON public.student_profiles FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'visa_officer')
  OR public.has_role(auth.uid(),'departure_coordinator') OR public.has_role(auth.uid(),'cskh')
  OR public.has_role(auth.uid(),'teacher') OR user_id = auth.uid()
);
CREATE POLICY "Managers can create student profiles" ON public.student_profiles FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant')
);
CREATE POLICY "Managers can update student profiles" ON public.student_profiles FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'visa_officer')
  OR public.has_role(auth.uid(),'departure_coordinator')
);
CREATE POLICY "Admins delete student profiles" ON public.student_profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.consultations
  ADD CONSTRAINT consultations_student_profile_id_fkey
  FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE SET NULL;

CREATE TABLE public.student_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_path text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes bigint,
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz
);
CREATE INDEX student_documents_profile_idx ON public.student_documents(student_profile_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_documents TO authenticated;
GRANT ALL ON public.student_documents TO service_role;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff & owner view documents" ON public.student_documents FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'visa_officer')
  OR public.has_role(auth.uid(),'departure_coordinator') OR public.has_role(auth.uid(),'cskh')
  OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = student_documents.student_profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "Staff manage documents" ON public.student_documents FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'visa_officer')
  OR public.has_role(auth.uid(),'departure_coordinator')
  OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = student_documents.student_profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "Staff update documents" ON public.student_documents FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'visa_officer')
  OR public.has_role(auth.uid(),'departure_coordinator')
);
CREATE POLICY "Admins delete documents" ON public.student_documents FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
);
CREATE TRIGGER trg_student_documents_updated_at BEFORE UPDATE ON public.student_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.student_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz
);
CREATE INDEX student_status_history_profile_idx ON public.student_status_history(student_profile_id);
GRANT SELECT, INSERT ON public.student_status_history TO authenticated;
GRANT ALL ON public.student_status_history TO service_role;
ALTER TABLE public.student_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff & owner view status history" ON public.student_status_history FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'visa_officer')
  OR public.has_role(auth.uid(),'departure_coordinator') OR public.has_role(auth.uid(),'cskh')
  OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = student_status_history.student_profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "Staff insert status history" ON public.student_status_history FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'visa_officer')
  OR public.has_role(auth.uid(),'departure_coordinator') OR public.has_role(auth.uid(),'cskh')
);

CREATE TABLE public.student_care_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz
);
CREATE INDEX student_care_logs_profile_idx ON public.student_care_logs(student_profile_id);
GRANT SELECT, INSERT, UPDATE ON public.student_care_logs TO authenticated;
GRANT ALL ON public.student_care_logs TO service_role;
ALTER TABLE public.student_care_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff & owner view care logs" ON public.student_care_logs FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'cskh')
  OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = student_care_logs.student_profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "Staff insert care logs" ON public.student_care_logs FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'cskh')
);
CREATE TRIGGER trg_student_care_logs_updated_at BEFORE UPDATE ON public.student_care_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.on_consultation_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_profile_id uuid;
BEGIN
  IF NEW.status = 'contacted'
     AND (OLD.status IS DISTINCT FROM 'contacted')
     AND NEW.student_profile_id IS NULL
  THEN
    INSERT INTO public.student_profiles (
      consultation_id, full_name, phone, email, program, country, current_status, meta
    ) VALUES (
      NEW.id, NEW.full_name, NEW.phone, NEW.email, NEW.program, NEW.market,
      'lead_contacted',
      jsonb_build_object('source', NEW.source, 'message', NEW.message)
    ) RETURNING id INTO new_profile_id;
    NEW.student_profile_id := new_profile_id;
    INSERT INTO public.student_status_history (student_profile_id, from_status, to_status, note)
    VALUES (new_profile_id, NULL, 'lead_contacted', 'Tự động tạo từ Lead khi chuyển sang trạng thái contacted');
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.on_consultation_status_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_consultations_auto_convert ON public.consultations;
CREATE TRIGGER trg_consultations_auto_convert
  BEFORE UPDATE OF status ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.on_consultation_status_change();
