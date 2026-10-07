export const vnd = (n: number | string | null | undefined) =>
  `${Math.round(Number(n || 0)).toLocaleString("vi-VN")} đ`;

export const CONTRACT_TYPE_LABEL: Record<string, string> = {
  probation: "Thử việc",
  fixed_term: "Xác định thời hạn",
  indefinite: "Không xác định thời hạn",
  collaborator: "Cộng tác",
};

export const LEAVE_TYPE_LABEL: Record<string, string> = {
  annual: "Nghỉ phép năm",
  sick: "Nghỉ ốm",
  personal: "Việc riêng (có lương)",
  unpaid: "Nghỉ không lương",
};

export const LEAVE_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã huỷ",
};

export const ATTENDANCE_LABEL: Record<string, string> = {
  present: "Đúng giờ",
  late: "Đi muộn",
  half: "Nửa ngày",
  absent: "Vắng",
};

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString("vi-VN") : "—";

export const fmtTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : "—";

export function currentPeriod() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date()).slice(0, 7);
}

export function daysUntil(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(`${d}T00:00:00`).getTime() - Date.now()) / 86_400_000);
}

export function downloadCsv(name: string, rows: Array<Array<string | number>>) {
  const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export const selectCls = "h-10 w-full rounded-md border bg-background px-3 text-sm";
