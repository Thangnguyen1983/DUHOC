/** Cấu hình nhân sự (lưu ở site_settings.hr_config) + hàm tính thuần dùng chung. */

export type Office = { name: string; lat: number; lng: number; radius: number };
export type TaxBracket = { upTo: number | null; rate: number };

export type HrConfig = {
  annual_leave_days: number;
  late_after: string; // "HH:MM"
  standard_days: number;
  insurance: {
    auto: boolean;
    bhxh: number; bhyt: number; bhtn: number; // % người lao động
    base: "base_salary" | "base_plus_allowance";
    cap: number; // trần lương đóng bảo hiểm (đ)
  };
  tax: {
    auto: boolean;
    personal_deduction: number;
    dependent_deduction: number;
    brackets: TaxBracket[];
  };
  attendance: {
    methods: { gps: boolean; wifi: boolean; qr: boolean; photo: boolean };
    match: "any" | "all";
    offices: Office[];
    allowed_ips: string[];
    qr_secret: string;
    qr_minutes: number;
  };
};

export const DEFAULT_HR_CONFIG: HrConfig = {
  annual_leave_days: 12,
  late_after: "08:15",
  standard_days: 26,
  insurance: { auto: true, bhxh: 8, bhyt: 1.5, bhtn: 1, base: "base_salary", cap: 46_800_000 },
  tax: {
    auto: true,
    personal_deduction: 15_500_000,
    dependent_deduction: 6_200_000,
    brackets: [
      { upTo: 5_000_000, rate: 5 }, { upTo: 10_000_000, rate: 10 }, { upTo: 18_000_000, rate: 15 },
      { upTo: 32_000_000, rate: 20 }, { upTo: 52_000_000, rate: 25 }, { upTo: 80_000_000, rate: 30 },
      { upTo: null, rate: 35 },
    ],
  },
  attendance: {
    methods: { gps: false, wifi: false, qr: false, photo: false },
    match: "all", offices: [], allowed_ips: [], qr_secret: "", qr_minutes: 5,
  },
};

export function mergeHrConfig(raw: any): HrConfig {
  const d = DEFAULT_HR_CONFIG;
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    ...d, ...r,
    insurance: { ...d.insurance, ...(r.insurance ?? {}) },
    tax: { ...d.tax, ...(r.tax ?? {}), brackets: r.tax?.brackets?.length ? r.tax.brackets : d.tax.brackets },
    attendance: {
      ...d.attendance, ...(r.attendance ?? {}),
      methods: { ...d.attendance.methods, ...(r.attendance?.methods ?? {}) },
    },
  };
}

export function calcInsurance(cfg: HrConfig, baseSalary: number, allowance: number) {
  const base = cfg.insurance.base === "base_plus_allowance" ? baseSalary + allowance : baseSalary;
  const capped = cfg.insurance.cap > 0 ? Math.min(base, cfg.insurance.cap) : base;
  const rate = (cfg.insurance.bhxh + cfg.insurance.bhyt + cfg.insurance.bhtn) / 100;
  return Math.round(capped * rate);
}

export function calcProgressiveTax(cfg: HrConfig, taxable: number) {
  if (taxable <= 0) return 0;
  let tax = 0, prev = 0;
  for (const b of cfg.tax.brackets) {
    const top = b.upTo ?? Infinity;
    if (taxable > prev) tax += (Math.min(taxable, top) - prev) * (b.rate / 100);
    prev = top;
    if (taxable <= top) break;
  }
  return Math.round(tax);
}

export function calcTax(cfg: HrConfig, gross: number, insurance: number, dependents: number) {
  const taxable = gross - insurance - cfg.tax.personal_deduction - dependents * cfg.tax.dependent_deduction;
  return calcProgressiveTax(cfg, taxable);
}

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, toR = (x: number) => (x * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
