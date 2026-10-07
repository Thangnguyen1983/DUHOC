CREATE TABLE public.page_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text UNIQUE NOT NULL,
  label text NOT NULL,
  eyebrow text,
  title text,
  description text,
  image_url text,
  overlay text NOT NULL DEFAULT 'dark',
  badge_label text,
  badge_icon text,
  cta_primary_label text,
  cta_primary_href text,
  cta_secondary_label text,
  cta_secondary_href text,
  stats jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.page_banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_banners TO authenticated;
GRANT ALL ON public.page_banners TO service_role;

ALTER TABLE public.page_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active banners" ON public.page_banners
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "editors read all banners" ON public.page_banners
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "editors insert banners" ON public.page_banners
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "editors update banners" ON public.page_banners
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "admins delete banners" ON public.page_banners
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER page_banners_updated_at
  BEFORE UPDATE ON public.page_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_page_banners_active ON public.page_banners(page_key) WHERE is_active = true;