
ALTER TABLE public.course_orders
  ADD COLUMN IF NOT EXISTS reminder_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at timestamptz;

CREATE TABLE IF NOT EXISTS public.email_template_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  subject text NOT NULL,
  intro_markdown text NOT NULL DEFAULT '',
  version int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT false,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_overrides_name_active ON public.email_template_overrides(template_name, is_active);
CREATE INDEX IF NOT EXISTS idx_email_overrides_name_version ON public.email_template_overrides(template_name, version DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_template_overrides TO authenticated;
GRANT ALL ON public.email_template_overrides TO service_role;

ALTER TABLE public.email_template_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_email_overrides" ON public.email_template_overrides;
CREATE POLICY "admin_all_email_overrides" ON public.email_template_overrides
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
