/**
 * Dựng báo cáo Excel cho các biểu đồ trang "Vận hành & Đào tạo".
 * Dùng lại bộ dựng workbook có định dạng thương hiệu ở students/xlsx-report.server.ts.
 */
import { buildStyledWorkbook, type ReportSheet } from "@/lib/students/xlsx-report.server";

export type ChartReportInput = {
  title: string;
  exportedBy: string;
  generatedAt: string;
  summary: Array<{ label: string; count: number }>;
  headers: string[];
  rows: string[][];
};

function vnDateTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export async function buildChartReportWorkbook(input: ChartReportInput): Promise<Uint8Array> {
  const total = input.summary.reduce((s, r) => s + r.count, 0);
  const subtitle = `Xuất lúc ${vnDateTime(input.generatedAt)} • Người xuất: ${input.exportedBy} • Tổng: ${total}`;

  const summarySheet: ReportSheet = {
    name: "Tổng hợp",
    title: `BÁO CÁO: ${input.title.toUpperCase()}`,
    subtitle,
    kind: "table",
    headers: ["Hạng mục", "Số lượng", "Tỷ lệ %"],
    rows: [
      ...input.summary.map((r) => [
        r.label,
        String(r.count),
        String(total > 0 ? Math.round((r.count / total) * 100) : 0),
      ]),
      ["TỔNG", String(total), "100"],
    ],
    footer: "Nguồn: Hệ thống quản trị Kaizen — trang Vận hành & Đào tạo.",
  };

  const detailSheet: ReportSheet = {
    name: "Chi tiết",
    title: `CHI TIẾT DỮ LIỆU: ${input.title.toUpperCase()}`,
    subtitle: `${input.rows.length} dòng dữ liệu thực • ${subtitle}`,
    kind: "table",
    headers: input.headers,
    rows: input.rows,
    footer: "Dữ liệu trích xuất trực tiếp từ hồ sơ đang lưu trên hệ thống.",
  };

  return buildStyledWorkbook([summarySheet, detailSheet]);
}
