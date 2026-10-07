CREATE TABLE public.departure_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination_country text,
  planned_date date,
  status text NOT NULL DEFAULT 'planned',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.departure_batches TO authenticated;
GRANT ALL ON public.departure_batches TO service_role;
ALTER TABLE public.departure_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departure_batches_read" ON public.departure_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "departure_batches_write" ON public.departure_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.departure_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid REFERENCES public.student_profiles(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES public.departure_batches(id) ON DELETE SET NULL,

  id_no text NOT NULL,
  id_issue_date date,
  passport_no text,
  passport_issue_date date,
  full_name text NOT NULL,
  gender text NOT NULL DEFAULT 'male',
  dob date,
  marital_status text,
  place_of_birth text,
  phone text,
  current_address text,
  province text,
  ward text,
  ethnicity text,
  religion text,
  education_level text,
  worked_abroad boolean NOT NULL DEFAULT false,
  land_lost boolean NOT NULL DEFAULT false,
  poor_household boolean NOT NULL DEFAULT false,
  veteran boolean NOT NULL DEFAULT false,
  ethnic_minority boolean NOT NULL DEFAULT false,

  destination_country text,
  occupation text,
  employer_name text,
  planned_departure_date date,
  actual_departure_date date,
  flight_no text,
  departure_airport text,
  arrival_airport text,
  status text NOT NULL DEFAULT 'planned',
  note text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.departure_records TO authenticated;
GRANT ALL ON public.departure_records TO service_role;
ALTER TABLE public.departure_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departure_records_read" ON public.departure_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "departure_records_write" ON public.departure_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX departure_records_id_no_unique ON public.departure_records (id_no) WHERE deleted_at IS NULL;
CREATE INDEX departure_records_status_idx ON public.departure_records (status);
CREATE INDEX departure_records_planned_idx ON public.departure_records (planned_departure_date);
CREATE INDEX departure_records_actual_idx ON public.departure_records (actual_departure_date);
CREATE INDEX departure_records_student_idx ON public.departure_records (student_profile_id);
CREATE INDEX departure_records_batch_idx ON public.departure_records (batch_id);

CREATE TRIGGER update_departure_batches_updated_at BEFORE UPDATE ON public.departure_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_departure_records_updated_at BEFORE UPDATE ON public.departure_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.departure_records REPLICA IDENTITY FULL;
ALTER TABLE public.departure_batches REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.departure_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.departure_batches;