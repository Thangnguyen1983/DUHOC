CREATE TABLE public.hot_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  href text NOT NULL,
  badge text,
  icon text NOT NULL DEFAULT 'Sparkles',
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hot_programs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hot_programs TO authenticated;
GRANT ALL ON public.hot_programs TO service_role;

ALTER TABLE public.hot_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active hot programs"
  ON public.hot_programs FOR SELECT
  TO anon, authenticated
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors insert hot programs"
  ON public.hot_programs FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors update hot programs"
  ON public.hot_programs FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors delete hot programs"
  ON public.hot_programs FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER update_hot_programs_updated_at
  BEFORE UPDATE ON public.hot_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.hot_programs (title, href, badge, icon, position) VALUES
  ('Kỹ sư Nhật Bản', '/xkld/nhat-ban', 'HOT', 'Briefcase', 0),
  ('Visa E-7 Hàn Quốc', '/xkld/han-quoc', 'HOT', 'Plane', 1),
  ('Học bổng Đài Loan', '/du-hoc/dai-loan', 'Mới', 'GraduationCap', 2),
  ('Ausbildung Đức', '/du-hoc/duc', 'HOT', 'Award', 3),
  ('Tiếng Nhật N4 cấp tốc', '/ngoai-ngu', NULL, 'Languages', 4),
  ('TOPIK Hàn Quốc', '/ngoai-ngu', NULL, 'Languages', 5),
  ('Du lịch & Visa châu Âu', '/du-lich-visa', 'Mới', 'Globe2', 6);