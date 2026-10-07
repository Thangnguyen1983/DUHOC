CREATE TABLE public.student_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_email text,
  actor_roles text[] NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'user',
  stage text,
  action text NOT NULL,
  entity text,
  entity_id text,
  field text,
  old_value text,
  new_value text,
  note text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.student_activity_logs TO authenticated;
GRANT ALL ON public.student_activity_logs TO service_role;

ALTER TABLE public.student_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read student activity logs"
ON public.student_activity_logs FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'consultant')
  OR public.has_role(auth.uid(), 'cskh')
  OR public.has_role(auth.uid(), 'visa_officer')
  OR public.has_role(auth.uid(), 'departure_coordinator')
  OR public.has_role(auth.uid(), 'teacher')
  OR public.has_role(auth.uid(), 'market_head')
);

CREATE INDEX idx_sal_profile_time ON public.student_activity_logs (student_profile_id, created_at DESC);
CREATE INDEX idx_sal_actor_time ON public.student_activity_logs (actor_id, created_at DESC);
CREATE INDEX idx_sal_action ON public.student_activity_logs (action);

ALTER TABLE public.student_activity_logs REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_activity_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Đánh dấu dữ liệu cũ không có người xử lý
UPDATE public.student_status_history
SET note = COALESCE(note, '') || ' [Hệ thống — dữ liệu trước khi bật lưu vết]'
WHERE actor_id IS NULL AND note IS DISTINCT FROM NULL
  AND note NOT LIKE '%trước khi bật lưu vết%';

UPDATE public.student_status_history
SET note = 'Hệ thống — dữ liệu trước khi bật lưu vết'
WHERE actor_id IS NULL AND note IS NULL;

UPDATE public.workflow_step_logs
SET meta = COALESCE(meta, '{}'::jsonb) || jsonb_build_object('actor_label', 'Hệ thống (tự động)')
WHERE actor_id IS NULL;