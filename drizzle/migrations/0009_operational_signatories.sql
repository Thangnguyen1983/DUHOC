CREATE TABLE public.operational_signatories (id boolean PRIMARY KEY DEFAULT true CHECK (id = true), orientation_approver_user_id uuid NULL, handover_signer_user_id uuid NULL, updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid NULL);
GRANT SELECT, INSERT, UPDATE ON public.operational_signatories TO authenticated;
GRANT ALL ON public.operational_signatories TO service_role;
ALTER TABLE public.operational_signatories ENABLE ROW LEVEL SECURITY;
CREATE POLICY operational_signatories_admin_read ON public.operational_signatories FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY operational_signatories_admin_insert ON public.operational_signatories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY operational_signatories_admin_update ON public.operational_signatories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));