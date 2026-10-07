/** Nguồn chuẩn duy nhất cho trạng thái khách tư vấn và cách tính chốt/bỏ trong báo cáo. */
export const LEAD_STATUSES = ["new", "contacted", "qualified", "done", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** "converted" chỉ còn ở dữ liệu cũ; vẫn tính là đã chốt để số liệu lịch sử không lệch. */
export const isLeadConverted = (s: unknown) => s === "done" || s === "converted";
export const isLeadLost = (s: unknown) => s === "lost";
