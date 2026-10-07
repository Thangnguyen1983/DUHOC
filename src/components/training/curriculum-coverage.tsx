import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCurriculumCoverage, MATERIAL_TYPES } from "@/lib/training/curriculum.functions";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";

/** Độ phủ tài liệu chuẩn theo từng buổi của khung chương trình. */
export function CurriculumCoverage({ templates, classes }: { templates: any[]; classes: any[] }) {
  const fetchCoverage = useServerFn(getCurriculumCoverage);
  const [templateId, setTemplateId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const tid = templateId || templates[0]?.id || "";
  const q = useQuery({
    queryKey: ["curriculum-coverage", tid, classId],
    queryFn: () => fetchCoverage({ data: { template_id: tid, class_id: classId || undefined } }),
    enabled: !!tid,
  });
  const typeLabel = (t: string) => MATERIAL_TYPES.find((x) => x.value === t)?.label ?? t;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={tid} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Toàn thị trường</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.code ? `${c.code} · ` : ""}{c.name}</option>)}
        </select>
      </div>
      {templates.length === 0 && <p className="text-sm text-muted-foreground">Chưa có khung chương trình chuẩn.</p>}
      {q.data && (
        <div className="rounded-2xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <div>
              <div className="font-bold">{q.data.template.name}</div>
              <div className="text-xs text-muted-foreground">Đủ tài liệu đã duyệt: {q.data.done}/{q.data.total} buổi</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-40 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${q.data.percent}%` }}/></div>
              <span className="text-sm font-semibold">{q.data.percent}%</span>
            </div>
          </div>
          <ul className="divide-y">
            {q.data.items.map(({ slot, materials, missing, complete }: any) => (
              <li key={slot.id} className="flex flex-wrap items-start gap-3 p-4">
                {complete ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600"/> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground"/>}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">Buổi {slot.lesson_no}: {slot.topic}</div>
                  {slot.objectives && <div className="text-xs text-muted-foreground">{slot.objectives}</div>}
                  <div className="mt-1 flex flex-wrap gap-1 text-xs">
                    {(slot.required_types ?? []).map((t: string) => (
                      <span key={t} className={`rounded-full px-2 py-0.5 ${missing.includes(t) ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>{typeLabel(t)}</span>
                    ))}
                  </div>
                  {materials.length > 0 && <div className="mt-1 text-xs text-muted-foreground">{materials.length} tài liệu gắn buổi này ({materials.filter((m: any) => m.approval_status === "approved").length} đã duyệt)</div>}
                </div>
                {!complete && <span className="flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="h-3 w-3"/> Thiếu {missing.length}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
