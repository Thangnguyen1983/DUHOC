CREATE TABLE public.archive_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  warehouse text,
  room text,
  cabinet text,
  shelf text,
  box text,
  capacity integer,
  note text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.student_archive_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.archive_locations(id) ON DELETE SET NULL,
  item_code text UNIQUE,
  doc_kind text,
  title text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  condition text,
  status text NOT NULL DEFAULT 'stored',
  stored_at date NOT NULL DEFAULT current_date,
  stored_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stored_by_email text,
  borrower_name text,
  borrowed_at date,
  due_date date,
  returned_at date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_archive_records_profile ON public.student_archive_records (student_profile_id, created_at DESC);
CREATE INDEX idx_archive_records_location ON public.student_archive_records (location_id);
CREATE INDEX idx_archive_records_status ON public.student_archive_records (status);

CREATE TABLE public.student_archive_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.student_archive_records(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_location_id uuid REFERENCES public.archive_locations(id) ON DELETE SET NULL,
  to_location_id uuid REFERENCES public.archive_locations(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_archive_movements_record ON public.student_archive_movements (record_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.archive_locations TO authenticated;
GRANT ALL ON public.archive_locations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_archive_records TO authenticated;
GRANT ALL ON public.student_archive_records TO service_role;
GRANT SELECT, INSERT ON public.student_archive_movements TO authenticated;
GRANT ALL ON public.student_archive_movements TO service_role;

ALTER TABLE public.archive_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_archive_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_archive_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read archive locations"
ON public.archive_locations FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'consultant')
  OR public.has_role(auth.uid(), 'visa_officer')
  OR public.has_role(auth.uid(), 'departure_coordinator')
  OR public.has_role(auth.uid(), 'cskh')
);

CREATE POLICY "Managers can write archive locations"
ON public.archive_locations FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'departure_coordinator')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'departure_coordinator')
);

CREATE POLICY "Staff can read archive records"
ON public.student_archive_records FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'consultant')
  OR public.has_role(auth.uid(), 'visa_officer')
  OR public.has_role(auth.uid(), 'departure_coordinator')
  OR public.has_role(auth.uid(), 'cskh')
);

CREATE POLICY "Staff can write archive records"
ON public.student_archive_records FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'visa_officer')
  OR public.has_role(auth.uid(), 'departure_coordinator')
  OR public.has_role(auth.uid(), 'cskh')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'visa_officer')
  OR public.has_role(auth.uid(), 'departure_coordinator')
  OR public.has_role(auth.uid(), 'cskh')
);

CREATE POLICY "Staff can read archive movements"
ON public.student_archive_movements FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'consultant')
  OR public.has_role(auth.uid(), 'visa_officer')
  OR public.has_role(auth.uid(), 'departure_coordinator')
  OR public.has_role(auth.uid(), 'cskh')
);

CREATE POLICY "Staff can insert archive movements"
ON public.student_archive_movements FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'training_manager')
  OR public.has_role(auth.uid(), 'visa_officer')
  OR public.has_role(auth.uid(), 'departure_coordinator')
  OR public.has_role(auth.uid(), 'cskh')
);

CREATE TRIGGER trg_archive_locations_updated
BEFORE UPDATE ON public.archive_locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_archive_records_updated
BEFORE UPDATE ON public.student_archive_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();