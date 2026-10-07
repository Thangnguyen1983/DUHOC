CREATE TABLE public.orientation_catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('framework','module','criterion','trainer')),
  market_code text,
  name text NOT NULL,
  hours integer,
  threshold numeric,
  unit text,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  trainer_type text,
  credential text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.orientation_catalog_items TO authenticated;
GRANT ALL ON public.orientation_catalog_items TO service_role;
ALTER TABLE public.orientation_catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in staff read orientation catalog" ON public.orientation_catalog_items FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_orientation_catalog_updated BEFORE UPDATE ON public.orientation_catalog_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();