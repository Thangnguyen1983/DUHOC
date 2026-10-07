CREATE TABLE public.catalog_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  flag text,
  region text NOT NULL DEFAULT 'asia',
  tagline text,
  description text,
  highlights text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.catalog_markets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_markets TO authenticated;
GRANT ALL ON public.catalog_markets TO service_role;

ALTER TABLE public.catalog_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active markets"
  ON public.catalog_markets FOR SELECT
  TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'training_manager'));

CREATE POLICY "Managers can write markets"
  ON public.catalog_markets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'training_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'training_manager'));

CREATE INDEX idx_catalog_markets_sort ON public.catalog_markets (sort_order);

CREATE TRIGGER update_catalog_markets_updated_at
  BEFORE UPDATE ON public.catalog_markets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();