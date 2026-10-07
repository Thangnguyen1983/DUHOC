export const COMMISSION_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  paid: "Đã thanh toán",
  cancelled: "Đã huỷ",
};

export const COMMISSION_STATUS_VARIANT: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  paid: "outline",
  cancelled: "destructive",
};

export const vnd = (n: number | string | null | undefined) =>
  `${Number(n ?? 0).toLocaleString("vi-VN")} VNĐ`;
