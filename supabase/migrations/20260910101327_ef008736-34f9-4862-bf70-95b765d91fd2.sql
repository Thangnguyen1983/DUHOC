CREATE TABLE public.catalog_provinces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  short_name text,
  division_type text,
  codename text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  merged_note text,
  source text,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.catalog_wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  province_code text NOT NULL REFERENCES public.catalog_provinces(code) ON UPDATE CASCADE ON DELETE CASCADE,
  division_type text,
  codename text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  merged_note text,
  source text,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalog_wards_province ON public.catalog_wards(province_code);
CREATE INDEX idx_catalog_wards_name ON public.catalog_wards(name);
CREATE INDEX idx_catalog_provinces_name ON public.catalog_provinces(name);

GRANT SELECT ON public.catalog_provinces TO anon;
GRANT SELECT ON public.catalog_wards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_provinces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_wards TO authenticated;
GRANT ALL ON public.catalog_provinces TO service_role;
GRANT ALL ON public.catalog_wards TO service_role;

ALTER TABLE public.catalog_provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_wards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provinces_public_read_active" ON public.catalog_provinces
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "provinces_auth_read" ON public.catalog_provinces
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "provinces_manage" ON public.catalog_provinces
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'training_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'training_manager'));

CREATE POLICY "wards_public_read_active" ON public.catalog_wards
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "wards_auth_read" ON public.catalog_wards
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "wards_manage" ON public.catalog_wards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'training_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'training_manager'));

CREATE TRIGGER trg_catalog_provinces_updated BEFORE UPDATE ON public.catalog_provinces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_catalog_wards_updated BEFORE UPDATE ON public.catalog_wards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();