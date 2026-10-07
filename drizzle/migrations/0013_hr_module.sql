CREATE TABLE public.staff_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contract_no text NOT NULL,
  contract_type text NOT NULL DEFAULT 'fixed_term',
  start_date date NOT NULL,
  end_date date,
  base_salary numeric NOT NULL DEFAULT 0,
  allowance numeric NOT NULL DEFAULT 0,
  file_url text,
  status text NOT NULL DEFAULT 'active',
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_no)
);
CREATE INDEX staff_contracts_user_idx ON public.staff_contracts(user_id);

CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  leave_type text NOT NULL DEFAULT 'annual',
  start_date date NOT NULL,
  end_date date NOT NULL,
  days numeric NOT NULL DEFAULT 1,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leave_requests_user_idx ON public.leave_requests(user_id, start_date);

CREATE TABLE public.leave_balances (
  user_id uuid NOT NULL,
  year integer NOT NULL,
  annual_days numeric NOT NULL DEFAULT 12,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, year)
);

CREATE TABLE public.attendance_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  work_date date NOT NULL,
  check_in timestamptz,
  check_out timestamptz,
  status text NOT NULL DEFAULT 'present',
  note text,
  edited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, work_date)
);

CREATE TABLE public.kpi_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period text NOT NULL,
  metric text NOT NULL,
  target numeric NOT NULL DEFAULT 0,
  actual numeric NOT NULL DEFAULT 0,
  auto_source text,
  bonus_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period, metric)
);

CREATE TABLE public.payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period text NOT NULL,
  standard_days numeric NOT NULL DEFAULT 26,
  work_days numeric NOT NULL DEFAULT 0,
  base_salary numeric NOT NULL DEFAULT 0,
  allowance numeric NOT NULL DEFAULT 0,
  kpi_bonus numeric NOT NULL DEFAULT 0,
  other_bonus numeric NOT NULL DEFAULT 0,
  insurance numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  net_pay numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  approved_by uuid,
  approved_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period)
);

GRANT SELECT ON public.staff_contracts, public.leave_requests, public.leave_balances, public.attendance_days, public.kpi_targets, public.payroll_items TO authenticated;
GRANT ALL ON public.staff_contracts, public.leave_requests, public.leave_balances, public.attendance_days, public.kpi_targets, public.payroll_items TO service_role;

ALTER TABLE public.staff_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own contracts" ON public.staff_contracts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own leave" ON public.leave_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own leave balance" ON public.leave_balances FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own attendance" ON public.attendance_days FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own kpi" ON public.kpi_targets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own approved payslip" ON public.payroll_items FOR SELECT TO authenticated USING (user_id = auth.uid() AND status = 'approved');

CREATE TRIGGER staff_contracts_updated BEFORE UPDATE ON public.staff_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER leave_requests_updated BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER attendance_days_updated BEFORE UPDATE ON public.attendance_days FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER kpi_targets_updated BEFORE UPDATE ON public.kpi_targets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER payroll_items_updated BEFORE UPDATE ON public.payroll_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();