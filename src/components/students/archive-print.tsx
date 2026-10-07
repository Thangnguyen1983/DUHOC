import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";
import JsBarcode from "jsbarcode";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, AlignmentType, ImageRun } from "docx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStudentChecklist, CHECKLIST_STAGE_LABEL, CHECKLIST_STATUS_LABEL, type ChecklistStage, type ChecklistStatus } from "@/lib/students/checklist.functions";
import { getSiteSettings } from "@/lib/settings.functions";
import { toast } from "sonner";

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

type ArchivePrintRecord = {
  student_profile_id: string;
  item_code?: string | null;
  title: string;
  stored_at?: string | null;
  condition?: string | null;
  archive_locations?: { code?: string; warehouse?: string; room?: string; cabinet?: string; shelf?: string; box?: string } | null;
  student_profiles?: { student_code?: string; full_name?: string; country?: string; program?: string } | null;
};

export function ArchivePrint({ record }: { record: ArchivePrintRecord }) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState("");
  const [barcode, setBarcode] = useState("");
  const [downloading, setDownloading] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const fetchChecklist = useServerFn(getStudentChecklist);
  const fetchSettings = useServerFn(getSiteSettings);
  const settings = useQuery({ queryKey: ["site-settings"], queryFn: () => fetchSettings(), enabled: open });
  const checklist = useQuery({
    queryKey: ["student-checklist", record.student_profile_id],
    queryFn: () => fetchChecklist({ data: { student_profile_id: record.student_profile_id } }),
    enabled: open,
  });
  useEffect(() => {
    if (!open) return;
    let active = true;
    const url = `${window.location.origin}/admin/students/${encodeURIComponent(record.student_profile_id)}`;
    QRCode.toDataURL(url, { margin: 1, width: 240 }).then((image) => { if (active) setQr(image); }).catch(() => { if (active) setQr(""); });
    try {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, record.item_code || record.student_profiles?.student_code || record.student_profile_id, { format: "CODE128", displayValue: false, margin: 2, width: 2, height: 55 });
      setBarcode(canvas.toDataURL("image/png"));
    } catch { setBarcode(""); }
    return () => { active = false; };
  }, [open, record.student_profile_id, record.item_code, record.student_profiles?.student_code]);

  async function downloadWord() {
    if (!checklist.data || !qr) return;
    setDownloading(true);
    try {
      const person = record.student_profiles;
      const loc = record.archive_locations;
      const text = (label: string, value: unknown) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(String(value ?? "—"))] });
      const cellBorder = { style: BorderStyle.SINGLE, size: 5, color: "D8D8D8" };
      const widths = [2900, 1500, 1300, 1200, 2460];
      const cell = (value: string, index: number, header = false) => new TableCell({
        width: { size: widths[index], type: WidthType.DXA }, borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
        shading: header ? { fill: "C92026", type: ShadingType.CLEAR } : undefined,
        margins: { top: 90, bottom: 90, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: value, bold: header, color: header ? "FFFFFF" : "222222", size: 18 })] })],
      });
      let logo: ImageRun | null = null;
      const logoUrl = settings.data?.logo_url;
      if (logoUrl?.startsWith("data:image/png;base64,") || logoUrl?.startsWith("data:image/jpeg;base64,")) {
        const binary = atob(logoUrl.split(",")[1] ?? "");
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        logo = new ImageRun({ type: logoUrl.startsWith("data:image/png") ? "png" : "jpg", data: bytes, transformation: { width: 105, height: 42 }, altText: { title: "Kaizen", description: "Logo Kaizen", name: "Logo" } });
      }
      const doc = new Document({ sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1100, right: 1100, bottom: 1100, left: 1100 } } }, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: logo ? [logo] : [new TextRun({ text: "KAIZEN MANPOWER", bold: true, size: 32, color: "C92026" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 220, after: 260 }, children: [new TextRun({ text: "BẢNG KIỂM HỒ SƠ GIẤY", bold: true, size: 30, color: "C92026" })] }),
        text("Học viên", person?.full_name), text("Mã học viên", person?.student_code),
        text("Thị trường / chương trình", `${person?.country ?? "—"} / ${person?.program ?? "—"}`),
        text("Phiếu lưu kho", `${record.item_code ?? "—"} — ${record.title}`),
        text("Vị trí", [loc?.code, loc?.warehouse, loc?.room, loc?.cabinet, loc?.shelf, loc?.box].filter(Boolean).join(" · ")),
        text("Ngày nhập / tình trạng", `${record.stored_at ?? "—"} / ${record.condition ?? "—"}`),
        new Paragraph({ spacing: { before: 220, after: 100 }, children: [new TextRun({ text: "DANH SÁCH GIẤY TỜ", bold: true, color: "3F7D3A", size: 22 })] }),
        new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: widths, rows: [
          new TableRow({ children: ["Giấy tờ", "Giai đoạn", "Trạng thái", "Bản cứng", "Ghi chú"].map((v, i) => cell(v, i, true)) }),
          ...(checklist.data.items.length ? checklist.data.items : [{ doc_name: "Chưa có mục nào trong bảng kiểm", stage: "", status: "", hard_copy_received: false, note: "" }]).map((item) => new TableRow({ children: [item.doc_name, CHECKLIST_STAGE_LABEL[item.stage as ChecklistStage] ?? item.stage, CHECKLIST_STATUS_LABEL[item.status as ChecklistStatus] ?? item.status, item.hard_copy_received ? "Có" : "Chưa", item.note ?? ""].map((v, i) => cell(String(v ?? ""), i)) })),
        ] }),
        new Paragraph({ spacing: { before: 450 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Người giao hồ sơ                         Cán bộ tiếp nhận                         Thủ kho", bold: true, size: 18 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Ký, ghi rõ họ tên)                       (Ký, ghi rõ họ tên)                       (Ký, ghi rõ họ tên)", size: 16 })] }),
      ] }] });
      const blob = await Packer.toBlob(doc);
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url; link.download = `bang-kiem-${person?.student_code ?? record.student_profile_id}.docx`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { toast.error("Không tạo được file Word. Vui lòng thử lại."); }
    finally { setDownloading(false); }
  }

  const html = useMemo(() => {
    const e = escapeHtml;
    const person = record.student_profiles;
    const loc = record.archive_locations;
    const position = [loc?.warehouse, loc?.room, loc?.cabinet, loc?.shelf, loc?.box].map((v, i) => v ? `${["Kho", "Phòng", "Tủ", "Kệ", "Hộp"][i]} ${v}` : "").filter(Boolean).join(" · ");
    const items = checklist.data?.items ?? [];
    const rows = items.map((item) => `<tr><td>${e(item.doc_name)}</td><td>${e(CHECKLIST_STAGE_LABEL[item.stage as ChecklistStage] ?? item.stage)}</td><td>${e(CHECKLIST_STATUS_LABEL[item.status as ChecklistStatus] ?? item.status)}</td><td>${item.hard_copy_received ? "Có" : "Chưa"}</td><td>${e(item.note)}</td></tr>`).join("");
    return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tem và bảng kiểm hồ sơ ${e(person?.student_code)}</title><style>
      @page { size: A4; margin: 12mm; } * { box-sizing: border-box; } body { margin: 0; color: #222; background: white; font: 12px Arial, sans-serif; } h1 { font-size: 20px; margin: 0 0 8px; color: #C92026; } h2 { font-size: 15px; margin: 0 0 8px; } .sheet { max-width: 210mm; margin: auto; padding: 12mm; } .brand { color: #C92026; font-size: 17px; font-weight: bold; margin-bottom: 7mm; border-bottom: 2px solid #3F7D3A; padding-bottom: 3mm; } .brand img { max-height: 13mm; max-width: 45mm; object-fit: contain; } .label { width: 100mm; min-height: 50mm; border: 1px dashed #777; display: flex; gap: 8px; padding: 7px; align-items: center; break-inside: avoid; } .label img.qr { width: 23mm; height: 23mm; flex-shrink: 0; } .barcode { width: 44mm; max-height: 9mm; object-fit: fill; display: block; margin-top: 2mm; } .code { font-weight: bold; font-size: 16px; color: #C92026; overflow-wrap: anywhere; } .detail { min-width: 0; line-height: 1.4; overflow-wrap: anywhere; font-size: 11px; } .check { margin-top: 14mm; } table { width: 100%; border-collapse: collapse; table-layout: fixed; } td, th { border: 1px solid #888; padding: 6px; text-align: left; vertical-align: top; overflow-wrap: anywhere; } th { background: #C92026; color: white; } th:first-child { width: 32%; } th:last-child { width: 25%; } .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center; margin-top: 16mm; min-height: 30mm; } .meta { line-height: 1.6; margin-bottom: 10px; overflow-wrap: anywhere; } @media screen { body { background: #eee; } .sheet { background: white; min-height: 297mm; box-shadow: 0 2px 12px #ddd; } } @media screen and (max-width: 600px) { .sheet { padding: 12px; min-width: 0; } .label { width: 100%; min-height: 0; gap: 8px; } .label img.qr { width: 54px; height: 54px; } .barcode { width: 100%; } .code { font-size: 14px; } h1 { font-size: 16px; } .check { margin-top: 25px; } th, td { padding: 3px; font-size: 9px; } .signatures { gap: 3px; font-size: 9px; } } @media print { .sheet { padding: 0; } }
    </style></head><body><div class="sheet"><div class="brand">${settings.data?.logo_url ? `<img src="${e(settings.data.logo_url)}" alt="KAIZEN">` : "KAIZEN MANPOWER"}</div><div class="label">${qr ? `<img class="qr" src="${qr}" alt="Mã QR hồ sơ">` : ""}<div class="detail"><div class="code">${e(person?.student_code ?? "Chưa có mã")}</div><strong>${e(person?.full_name)}</strong><br>${e(record.title)}<br>${e(loc?.code)} ${e(position)}${barcode ? `<img class="barcode" src="${barcode}" alt="Mã vạch hồ sơ">` : ""}<small>${e(record.item_code ?? person?.student_code)}</small></div></div><section class="check"><h1>BẢNG KIỂM HỒ SƠ GIẤY</h1><div class="meta"><strong>Học viên:</strong> ${e(person?.full_name)} · <strong>Mã:</strong> ${e(person?.student_code)}<br><strong>Thị trường / chương trình:</strong> ${e(person?.country)} / ${e(person?.program)}<br><strong>Phiếu:</strong> ${e(record.item_code ?? "—")} · <strong>Vị trí:</strong> ${e(loc?.code)} ${e(position)}<br><strong>Ngày nhập:</strong> ${e(record.stored_at ?? "—")} · <strong>Tình trạng:</strong> ${e(record.condition ?? "—")}</div><table><thead><tr><th>Giấy tờ</th><th>Giai đoạn</th><th>Trạng thái</th><th>Bản cứng</th><th>Ghi chú</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Chưa có mục nào trong bảng kiểm.</td></tr>'}</tbody></table><div class="signatures"><strong>Người giao hồ sơ<br>(Ký, ghi rõ họ tên)</strong><strong>Cán bộ tiếp nhận<br>(Ký, ghi rõ họ tên)</strong><strong>Thủ kho<br>(Ký, ghi rõ họ tên)</strong></div></section></div></body></html>`;
  }, [record, checklist.data, qr, barcode, settings.data]);

  return <>
    <Button size="icon" variant="ghost" title="In tem và bảng kiểm" aria-label="In tem và bảng kiểm" onClick={() => setOpen(true)}><Printer className="h-4 w-4" /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="flex h-[min(90dvh,900px)] w-[calc(100vw-24px)] max-w-[900px] flex-col overflow-hidden p-3 sm:p-6"><DialogHeader><DialogTitle>Tem hồ sơ và bảng kiểm</DialogTitle></DialogHeader><div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3"><div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><span>Xem trước bản A4 và tem 100 × 50 mm</span><div className="flex gap-2"><Button variant="outline" disabled={checklist.isLoading || checklist.isError || !qr || downloading} onClick={downloadWord}><Download className="mr-2 h-4 w-4" />Tải Word</Button><Button disabled={checklist.isLoading || checklist.isError || !qr || !barcode} onClick={() => frame.current?.contentWindow?.print()}><Printer className="mr-2 h-4 w-4" />In</Button></div></div>{checklist.isError ? <p role="alert">Không tải được bảng kiểm. Vui lòng thử lại.</p> : <iframe ref={frame} title="Xem trước tem và bảng kiểm" srcDoc={html} className="min-h-0 min-w-0 w-full flex-1 rounded border bg-background" />}</div></DialogContent></Dialog>
  </>;
}
