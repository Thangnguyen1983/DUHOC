export type ContractLevel = "none" | "ok" | "d90" | "d30" | "d7" | "overdue";

export function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const end = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

export function contractLevel(dateStr?: string | null): ContractLevel {
  const d = daysUntil(dateStr);
  if (d === null) return "none";
  if (d < 0) return "overdue";
  if (d <= 7) return "d7";
  if (d <= 30) return "d30";
  if (d <= 90) return "d90";
  return "ok";
}

export const CONTRACT_LABEL: Record<ContractLevel, string> = {
  none: "Chưa có hạn",
  ok: "Còn hạn",
  d90: "Còn ≤ 90 ngày",
  d30: "Còn ≤ 30 ngày",
  d7: "Còn ≤ 7 ngày",
  overdue: "Đã quá hạn",
};

export const CONTRACT_CLASS: Record<ContractLevel, string> = {
  none: "bg-muted text-muted-foreground",
  ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  d90: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  d30: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  d7: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  overdue: "bg-red-600 text-white",
};

export function contractText(dateStr?: string | null): string {
  const d = daysUntil(dateStr);
  if (d === null) return "—";
  if (d < 0) return `Quá hạn ${Math.abs(d)} ngày`;
  if (d === 0) return "Hết hạn hôm nay";
  return `Còn ${d} ngày`;
}

export function fmtDate(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(`${v}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("vi-VN");
}
