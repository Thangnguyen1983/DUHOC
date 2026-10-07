ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS collaborator_id uuid REFERENCES public.sales_agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS collaborator_code text;
CREATE INDEX IF NOT EXISTS idx_student_profiles_collaborator ON public.student_profiles(collaborator_id);

CREATE TABLE public.collaborator_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id uuid NOT NULL REFERENCES public.sales_agents(id) ON DELETE RESTRICT,
  collaborator_code text,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  order_title text,
  program_type text,
  order_revenue numeric(14,0) NOT NULL DEFAULT 0 CHECK (order_revenue >= 0),
  commission_amount numeric(14,0) NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),
  note text,
  approved_by uuid,
  approved_at timestamptz,
  paid_by uuid,
  paid_at timestamptz,
  payment_reference text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_commissions_collaborator ON public.collaborator_commissions(collaborator_id);
CREATE INDEX idx_commissions_student ON public.collaborator_commissions(student_profile_id);

GRANT ALL ON public.collaborator_commissions TO service_role;
ALTER TABLE public.collaborator_commissions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_collaborator_commissions_updated
BEFORE UPDATE ON public.collaborator_commissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();