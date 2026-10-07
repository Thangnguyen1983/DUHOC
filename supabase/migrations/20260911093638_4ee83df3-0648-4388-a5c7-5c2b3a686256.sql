CREATE TABLE public.catalog_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'geo',
  trigger_source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  provinces_count integer,
  wards_count integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_catalog_sync_logs_kind_started ON public.catalog_sync_logs(kind, started_at DESC);
GRANT SELECT ON public.catalog_sync_logs TO authenticated;
GRANT ALL ON public.catalog_sync_logs TO service_role;
ALTER TABLE public.catalog_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_logs_auth_read" ON public.catalog_sync_logs
  FOR SELECT TO authenticated USING (true);