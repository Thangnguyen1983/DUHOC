CREATE TABLE public.student_dossier_reviews (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  market text,
  completeness_percent integer not null default 0,
  visa_score integer not null default 0,
  risk_level text not null default 'medium',
  summary text,
  issues jsonb not null default '[]'::jsonb,
  suggestions jsonb not null default '[]'::jsonb,
  model text,
  created_by uuid,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_sdr_profile ON public.student_dossier_reviews (student_profile_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_dossier_reviews TO authenticated;
GRANT ALL ON public.student_dossier_reviews TO service_role;

ALTER TABLE public.student_dossier_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read dossier reviews" ON public.student_dossier_reviews
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'cskh')
  OR public.has_role(auth.uid(),'visa_officer') OR public.has_role(auth.uid(),'departure_coordinator')
  OR public.has_role(auth.uid(),'market_head')
  OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = student_profile_id AND sp.user_id = auth.uid())
);

CREATE POLICY "Staff can write dossier reviews" ON public.student_dossier_reviews
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'visa_officer')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'market_head')
)
WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'visa_officer')
  OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'market_head')
);