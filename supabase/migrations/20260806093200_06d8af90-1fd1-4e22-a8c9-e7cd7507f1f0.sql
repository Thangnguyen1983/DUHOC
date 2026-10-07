CREATE TABLE public.site_popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  cta_label text NOT NULL DEFAULT 'Tìm hiểu ngay',
  cta_href text NOT NULL DEFAULT '/dang-ky',
  starts_at timestamptz,
  ends_at timestamptz,
  dismiss_hours integer NOT NULL DEFAULT 24,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_popups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_popups TO authenticated;
GRANT ALL ON public.site_popups TO service_role;

ALTER TABLE public.site_popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active popups"
ON public.site_popups FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Editors can view all popups"
ON public.site_popups FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can insert popups"
ON public.site_popups FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can update popups"
ON public.site_popups FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can delete popups"
ON public.site_popups FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER trg_site_popups_updated
BEFORE UPDATE ON public.site_popups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();