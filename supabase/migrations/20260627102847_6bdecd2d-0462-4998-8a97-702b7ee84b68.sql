
-- =========================================
-- PHA 2: WORKFLOW ENGINE
-- =========================================

-- 1) workflow_definitions
CREATE TABLE public.workflow_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  version int NOT NULL DEFAULT 1,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (slug, version)
);
CREATE UNIQUE INDEX workflow_definitions_one_active_per_slug
  ON public.workflow_definitions (slug) WHERE is_active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_definitions TO authenticated;
GRANT ALL ON public.workflow_definitions TO service_role;
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wf_def_admin_all" ON public.workflow_definitions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

CREATE POLICY "wf_def_staff_read" ON public.workflow_definitions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'consultant')
    OR public.has_role(auth.uid(),'teacher')
    OR public.has_role(auth.uid(),'visa_officer')
    OR public.has_role(auth.uid(),'departure_coordinator')
    OR public.has_role(auth.uid(),'cskh')
    OR public.has_role(auth.uid(),'editor')
  );

CREATE TRIGGER trg_wf_def_updated BEFORE UPDATE ON public.workflow_definitions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2) workflow_instances
CREATE TABLE public.workflow_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id uuid NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE RESTRICT,
  student_profile_id uuid NOT NULL UNIQUE REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  current_step text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','done','cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wf_instances_student_idx ON public.workflow_instances(student_profile_id);
CREATE INDEX wf_instances_step_idx ON public.workflow_instances(current_step);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_instances TO authenticated;
GRANT ALL ON public.workflow_instances TO service_role;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wf_inst_admin_all" ON public.workflow_instances
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

CREATE POLICY "wf_inst_staff_read" ON public.workflow_instances
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'consultant')
    OR public.has_role(auth.uid(),'teacher')
    OR public.has_role(auth.uid(),'visa_officer')
    OR public.has_role(auth.uid(),'departure_coordinator')
    OR public.has_role(auth.uid(),'cskh')
  );

CREATE POLICY "wf_inst_student_read_own" ON public.workflow_instances
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = workflow_instances.student_profile_id
        AND sp.user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_wf_inst_updated BEFORE UPDATE ON public.workflow_instances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 3) workflow_step_logs
CREATE TABLE public.workflow_step_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  attachment_path text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX wf_step_logs_instance_idx ON public.workflow_step_logs(instance_id);
CREATE INDEX wf_step_logs_student_idx ON public.workflow_step_logs(student_profile_id);

GRANT SELECT, INSERT ON public.workflow_step_logs TO authenticated;
GRANT ALL ON public.workflow_step_logs TO service_role;
ALTER TABLE public.workflow_step_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wf_logs_admin_all" ON public.workflow_step_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

CREATE POLICY "wf_logs_staff_read" ON public.workflow_step_logs
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'consultant')
    OR public.has_role(auth.uid(),'teacher')
    OR public.has_role(auth.uid(),'visa_officer')
    OR public.has_role(auth.uid(),'departure_coordinator')
    OR public.has_role(auth.uid(),'cskh')
  );

CREATE POLICY "wf_logs_staff_insert" ON public.workflow_step_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'consultant')
    OR public.has_role(auth.uid(),'teacher')
    OR public.has_role(auth.uid(),'visa_officer')
    OR public.has_role(auth.uid(),'departure_coordinator')
    OR public.has_role(auth.uid(),'cskh')
  );

CREATE POLICY "wf_logs_student_read_own" ON public.workflow_step_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = workflow_step_logs.student_profile_id
        AND sp.user_id = auth.uid()
    )
  );


-- 4) notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON public.notifications(user_id) WHERE read_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_read_own" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "notif_admin_all" ON public.notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));


-- 5) Trigger: tự sinh workflow_instance khi tạo student_profile
CREATE OR REPLACE FUNCTION public.on_student_profile_insert_create_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  def_id uuid;
  first_step text;
BEGIN
  SELECT id, COALESCE(steps->0->>'key', NEW.current_status)
    INTO def_id, first_step
  FROM public.workflow_definitions
  WHERE slug = 'default_outbound' AND is_active = true
  ORDER BY version DESC LIMIT 1;

  IF def_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.workflow_instances (definition_id, student_profile_id, current_step)
  VALUES (def_id, NEW.id, COALESCE(NEW.current_status, first_step))
  ON CONFLICT (student_profile_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.on_student_profile_insert_create_workflow() FROM anon, authenticated;

CREATE TRIGGER trg_student_profile_create_workflow
AFTER INSERT ON public.student_profiles
FOR EACH ROW EXECUTE FUNCTION public.on_student_profile_insert_create_workflow();


-- 6) Seed default_outbound v1 với 18 bước
INSERT INTO public.workflow_definitions (slug, name, version, is_active, description, steps)
VALUES (
  'default_outbound',
  'Quy trình XKLĐ/Du học mặc định',
  1,
  true,
  '18 bước chuẩn từ Lead mới đến hậu xuất cảnh',
  $json$[
    {"key":"lead_new","label":"Lead mới","role_required":["consultant","admin","training_manager"],"sla_hours":24,"next_steps":["consulting","cancelled"]},
    {"key":"consulting","label":"Đang tư vấn","role_required":["consultant","admin","training_manager"],"sla_hours":72,"next_steps":["profile_created","paused","cancelled"]},
    {"key":"profile_created","label":"Đã tạo hồ sơ","role_required":["consultant","admin","training_manager"],"sla_hours":168,"next_steps":["contract_pending","cancelled"]},
    {"key":"contract_pending","label":"Chờ ký hợp đồng","role_required":["consultant","admin","training_manager"],"sla_hours":168,"next_steps":["contract_signed","cancelled"]},
    {"key":"contract_signed","label":"Đã ký hợp đồng","role_required":["consultant","admin","training_manager"],"sla_hours":72,"next_steps":["class_pending"]},
    {"key":"class_pending","label":"Chờ xếp lớp","role_required":["training_manager","admin"],"sla_hours":168,"next_steps":["training"]},
    {"key":"training","label":"Đang đào tạo","role_required":["teacher","training_manager","admin"],"sla_hours":2160,"next_steps":["exam_pending","paused"]},
    {"key":"exam_pending","label":"Chờ thi","role_required":["teacher","training_manager","admin"],"sla_hours":336,"next_steps":["training_passed","training"]},
    {"key":"training_passed","label":"Đạt đào tạo","role_required":["teacher","training_manager","admin"],"sla_hours":168,"next_steps":["transfer_visa"]},
    {"key":"transfer_visa","label":"Chuyển bộ phận Visa","role_required":["training_manager","visa_officer","admin"],"sla_hours":72,"next_steps":["visa_processing"]},
    {"key":"visa_processing","label":"Đang xử lý visa","role_required":["visa_officer","admin"],"sla_hours":720,"next_steps":["visa_granted","cancelled"]},
    {"key":"visa_granted","label":"Có visa","role_required":["visa_officer","admin"],"sla_hours":168,"next_steps":["departure_pending"]},
    {"key":"departure_pending","label":"Chờ xuất cảnh","role_required":["departure_coordinator","admin"],"sla_hours":336,"next_steps":["departed"]},
    {"key":"departed","label":"Đã xuất cảnh","role_required":["departure_coordinator","admin"],"sla_hours":168,"next_steps":["post_departure"]},
    {"key":"post_departure","label":"Hậu xuất cảnh / CSKH","role_required":["cskh","admin"],"sla_hours":2160,"next_steps":["completed"]},
    {"key":"completed","label":"Hoàn thành","role_required":["admin","training_manager"],"sla_hours":null,"next_steps":[]},
    {"key":"paused","label":"Tạm dừng","role_required":["admin","training_manager","consultant"],"sla_hours":null,"next_steps":["consulting","training","cancelled"]},
    {"key":"cancelled","label":"Đã huỷ","role_required":["admin","training_manager","consultant"],"sla_hours":null,"next_steps":[]}
  ]$json$::jsonb
);
