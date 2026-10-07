ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS claim_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS reassign_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_consultations_assigned_to ON public.consultations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_consultations_claim_deadline ON public.consultations(claim_deadline);

CREATE TABLE public.sales_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  markets text[] NOT NULL DEFAULT '{}',
  max_open_leads integer NOT NULL DEFAULT 20,
  claim_minutes integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  last_assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_agents TO authenticated;
GRANT ALL ON public.sales_agents TO service_role;
ALTER TABLE public.sales_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view sales agents" ON public.sales_agents
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'market_head')
  OR public.has_role(auth.uid(), 'sales')
  OR public.has_role(auth.uid(), 'consultant')
  OR public.has_role(auth.uid(), 'cskh')
);

CREATE POLICY "Managers manage sales agents" ON public.sales_agents
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'market_head'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'market_head'));

CREATE TRIGGER trg_sales_agents_updated
BEFORE UPDATE ON public.sales_agents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lead_assignment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_user uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  to_user uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_logs_consultation ON public.lead_assignment_logs(consultation_id);

GRANT SELECT, INSERT ON public.lead_assignment_logs TO authenticated;
GRANT ALL ON public.lead_assignment_logs TO service_role;
ALTER TABLE public.lead_assignment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view lead logs" ON public.lead_assignment_logs
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'market_head')
  OR public.has_role(auth.uid(), 'sales')
  OR public.has_role(auth.uid(), 'consultant')
  OR public.has_role(auth.uid(), 'cskh')
);