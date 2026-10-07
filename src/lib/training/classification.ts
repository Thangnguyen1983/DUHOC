/** Phân loại chương trình đào tạo & tiện ích khoá tuyển sinh (client-safe). */

export const PROGRAM_TYPES = [
  { value: "language", label: "Tiếng" },
  { value: "vocational", label: "Nghề" },
  { value: "orientation", label: "Định hướng" },
  { value: "soft_skill", label: "Kỹ năng mềm" },
  { value: "other", label: "Khác" },
] as const;

export type ProgramType = (typeof PROGRAM_TYPES)[number]["value"];

export function programTypeLabel(v?: string | null) {
  return PROGRAM_TYPES.find((p) => p.value === v)?.label ?? "Chưa phân loại";
}

export const CLASS_STATUSES = [
  { value: "planning", label: "Lên kế hoạch" },
  { value: "open", label: "Đang tuyển" },
  { value: "in_progress", label: "Đang học" },
  { value: "finished", label: "Kết thúc" },
  { value: "cancelled", label: "Đã huỷ" },
] as const;

export function classStatusLabel(v?: string | null) {
  return CLASS_STATUSES.find((s) => s.value === v)?.label ?? v ?? "";
}

export function classStatusColor(v?: string | null) {
  return (
    {
      planning: "bg-blue-100 text-blue-700",
      open: "bg-amber-100 text-amber-700",
      in_progress: "bg-emerald-100 text-emerald-700",
      finished: "bg-muted text-muted-foreground",
      cancelled: "bg-red-100 text-red-700",
    } as Record<string, string>
  )[v ?? ""] ?? "bg-muted text-muted-foreground";
}

/** Gợi ý khoá tuyển sinh từ ngày khai giảng: 2026-03 */
export function suggestCohort(startDate?: string | null) {
  if (!startDate) return "";
  return startDate.slice(0, 7);
}
