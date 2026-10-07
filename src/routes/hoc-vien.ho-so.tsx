import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyPortal } from "@/lib/portal/portal.functions";
import {
  getMyChecklist,
  checklistProgress,
  CHECKLIST_STATUS_LABEL,
  type ChecklistStatus,
} from "@/lib/students/checklist.functions";
import { Progress } from "@/components/ui/progress";
import {
  UserPlus, PhoneCall, FileText, PenLine, FileSignature, School,
  GraduationCap, ClipboardCheck, Award, FolderSymlink, FileSearch,
  Stamp, Luggage, PlaneTakeoff, HeartHandshake, BadgeCheck,
  PauseCircle, XCircle, MapPin,
} from "lucide-react";

export const Route = createFileRoute("/hoc-vien/ho-so")({ component: ProfilePage });

const CHECK_STYLE: Record<ChecklistStatus, string> = {
  missing: "bg-muted text-muted-foreground",
  submitted: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-100 text-emerald-700",
  rejected: "bg-destructive/15 text-destructive",
  na: "bg-muted text-muted-foreground",
};

function ProfilePage() {
  const fetchPortal = useServerFn(getMyPortal);
  const fetchChecklist = useServerFn(getMyChecklist);
  const { data, isLoading } = useQuery({ queryKey: ["my-portal"], queryFn: () => fetchPortal() });
  const checklistQ = useQuery({ queryKey: ["my-checklist"], queryFn: () => fetchChecklist() });


  if (isLoading) return <div>Đang tải...</div>;
  if (!data?.profile) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Chưa có hồ sơ học viên cho tài khoản này. Vui lòng liên hệ tư vấn viên Kaizen.
      </div>
    );
  }
  const p = data.profile;
  const steps = (data.workflow?.workflow_definitions?.steps ?? []) as any[];
  const currentIdx = steps.findIndex((s) => s.key === data.workflow?.current_step);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ của tôi</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Họ và tên" value={p.full_name} />
        <Field label="Số điện thoại" value={p.phone ?? "—"} />
        <Field label="Email" value={p.email ?? "—"} />
        <Field label="Chương trình" value={p.program ?? "—"} />
        <Field label="Quốc gia" value={p.country ?? "—"} />
        <Field label="Trạng thái" value={p.current_status} />
      </div>

      {steps.length > 0 && <StepTimeline steps={steps} currentIdx={currentIdx} />}

      {(() => {
        const items = (checklistQ.data?.items ?? []) as any[];
        if (!items.length) return null;
        const p = checklistProgress(items);
        return (
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between gap-4 mb-3">
              <h2 className="font-semibold">Checklist hồ sơ du học</h2>
              <span className="text-sm font-semibold">{p.percent}%</span>
            </div>
            <Progress value={p.percent} className="h-2 mb-4" />
            <ul className="divide-y">
              {items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    {it.doc_name}
                    {it.is_required && <span className="ml-1 text-destructive">*</span>}
                    {it.note && <span className="block text-xs text-muted-foreground">{it.note}</span>}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${CHECK_STYLE[it.status as ChecklistStatus]}`}>
                    {CHECKLIST_STATUS_LABEL[it.status as ChecklistStatus]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-3">Tài liệu của tôi</h2>

        {data.documents.length === 0 && <p className="text-sm text-muted-foreground">Chưa có tài liệu.</p>}
        <ul className="divide-y">
          {data.documents.map((d: any) => (
            <li key={d.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium">{d.file_name ?? d.doc_type}</div>
                <div className="text-xs text-muted-foreground">{d.doc_type}</div>
              </div>
              <span className={`text-xs rounded-full px-2 py-0.5 ${d.verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {d.verified ? "Đã duyệt" : "Chờ duyệt"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const STEP_ICONS = [
  UserPlus, PhoneCall, FileText, PenLine, FileSignature, School,
  GraduationCap, ClipboardCheck, Award, FolderSymlink, FileSearch,
  Stamp, Luggage, PlaneTakeoff, HeartHandshake, BadgeCheck,
  PauseCircle, XCircle,
];

function stepTone(i: number, currentIdx: number) {
  const isTerminalPause = i === 16 && i === currentIdx;
  const isTerminalCancel = i === 17 && i === currentIdx;
  if (isTerminalCancel) return "bg-destructive text-destructive-foreground ring-4 ring-destructive/25";
  if (isTerminalPause) return "bg-amber-500 text-white ring-4 ring-amber-500/25";
  if (i < currentIdx) return "bg-emerald-500/15 text-emerald-600";
  if (i === currentIdx) return "bg-primary text-primary-foreground ring-4 ring-primary/25";
  return "bg-muted text-muted-foreground";
}

function lineTone(i: number, currentIdx: number) {
  // đường nối TỚI bước i: xanh nếu bước i đã qua/đang ở, xám đứt nét nếu chưa tới
  return i <= currentIdx ? "bg-emerald-500" : "border-t-2 border-dashed border-border";
}

function StepItem({ s, i, currentIdx, last }: { s: any; i: number; currentIdx: number; last: boolean }) {
  const Icon = STEP_ICONS[i] ?? FileText;
  const current = i === currentIdx;
  return (
    <li className="flex w-24 shrink-0 snap-start flex-col items-center text-center lg:w-auto lg:min-w-0">
      <div className="relative flex w-full items-center justify-center">
        <span className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : lineTone(i, currentIdx)}`} />
        <span
          className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full transition ${stepTone(i, currentIdx)}`}
          title={`Bước ${i + 1}: ${s.label}`}
        >
          <Icon className="h-5 w-5" />
          <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-card text-[9px] font-bold text-foreground shadow-sm ring-1 ring-border">
            {i + 1}
          </span>
        </span>
        <span className={`h-0.5 flex-1 ${last ? "opacity-0" : lineTone(i + 1, currentIdx)}`} />
      </div>
      <span
        className={`mt-2 line-clamp-2 text-[11px] leading-tight ${
          current ? "font-bold text-primary" : i < currentIdx ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {s.label}
      </span>
      {current && (
        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          <MapPin className="h-3 w-3" /> Bạn đang ở đây
        </span>
      )}
    </li>
  );
}

function StepTimeline({ steps, currentIdx }: { steps: any[]; currentIdx: number }) {
  const total = steps.length;
  const done = Math.max(currentIdx, 0);
  const percent = total > 0 ? Math.round(((done + 1) / total) * 100) : 0;
  const currentLabel = currentIdx >= 0 ? steps[currentIdx]?.label : "—";
  const half = Math.ceil(total / 2);
  const row1 = steps.slice(0, half);
  const row2 = steps.slice(half);

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Tiến trình {total} bước</h2>
        <span className="text-sm font-semibold text-primary">
          Bước {done + 1}/{total} — {currentLabel}
        </span>
      </div>
      <Progress value={percent} className="mb-5 h-2" />

      {/* Mobile: cuộn ngang */}
      <ol className="-mx-2 flex snap-x snap-mandatory overflow-x-auto px-2 pb-2 lg:hidden">
        {steps.map((s, i) => (
          <StepItem key={s.key} s={s} i={i} currentIdx={currentIdx} last={i === total - 1} />
        ))}
      </ol>

      {/* Desktop: 2 hàng, hàng 2 bẻ ngược */}
      <div className="hidden space-y-6 lg:block">
        <ol className="grid grid-cols-9">
          {row1.map((s, i) => (
            <StepItem key={s.key} s={s} i={i} currentIdx={currentIdx} last={i === row1.length - 1 && row2.length === 0} />
          ))}
        </ol>
        {row2.length > 0 && (
          <ol className="grid grid-cols-9" style={{ direction: "rtl" }}>
            {row2.map((s, k) => {
              const i = half + k;
              return <StepItem key={s.key} s={s} i={i} currentIdx={currentIdx} last={i === total - 1} />;
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
