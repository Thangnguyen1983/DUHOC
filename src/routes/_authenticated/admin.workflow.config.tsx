import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getActiveDefinition, saveDefinitionVersion } from "@/lib/workflow/workflow.functions";

export const Route = createFileRoute("/_authenticated/admin/workflow/config")({
  component: WorkflowConfig,
});

type StepRow = {
  key: string;
  label: string;
  role_required: string;
  sla_hours: string;
  next_steps: string;
};

const ROLE_OPTIONS = [
  "admin",
  "training_manager",
  "consultant",
  "teacher",
  "visa_officer",
  "departure_coordinator",
  "cskh",
];

function toRow(s: any): StepRow {
  return {
    key: s.key ?? "",
    label: s.label ?? "",
    role_required: (s.role_required ?? []).join(","),
    sla_hours: s.sla_hours == null ? "" : String(s.sla_hours),
    next_steps: (s.next_steps ?? []).join(","),
  };
}

function fromRow(r: StepRow) {
  return {
    key: r.key.trim(),
    label: r.label.trim(),
    role_required: r.role_required.split(",").map((s) => s.trim()).filter(Boolean),
    sla_hours: r.sla_hours.trim() === "" ? null : Number(r.sla_hours),
    next_steps: r.next_steps.split(",").map((s) => s.trim()).filter(Boolean),
  };
}

function WorkflowConfig() {
  const fetchDef = useServerFn(getActiveDefinition);
  const saveDef = useServerFn(saveDefinitionVersion);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["wf-active-def"], queryFn: () => fetchDef() });

  const [name, setName] = useState("Quy trình XKLĐ/Du học mặc định");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<StepRow[]>([]);

  useEffect(() => {
    const def = data?.definition as any;
    if (def) {
      setName(def.name ?? "");
      setDescription(def.description ?? "");
      setRows((def.steps ?? []).map(toRow));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      saveDef({
        data: {
          slug: "default_outbound",
          name,
          description: description || null,
          steps: rows.map(fromRow),
          activate: true,
        },
      }),
    onSuccess: (res: any) => {
      toast.success(`Đã lưu phiên bản v${res.version}`);
      refetch();
    },
    onError: (e) => toast.error(errorMessage(e, "Lưu thất bại")),
  });

  function update(i: number, patch: Partial<StepRow>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  }
  function add() {
    setRows((rs) => [...rs, { key: "", label: "", role_required: "admin", sla_hours: "", next_steps: "" }]);
  }
  function move(i: number, dir: -1 | 1) {
    setRows((rs) => {
      const j = i + dir;
      if (j < 0 || j >= rs.length) return rs;
      const copy = rs.slice();
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/workflow" className="rounded-md border p-2 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Cấu hình Workflow</h1>
            <p className="text-sm text-muted-foreground">
              Lưu sẽ tạo phiên bản mới và kích hoạt. Các phiên bản đang chạy giữ nguyên.
            </p>
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="mr-2 h-4 w-4" /> {save.isPending ? "Đang lưu..." : "Lưu phiên bản mới"}
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">Tên quy trình</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">Mô tả</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b p-3">
          <div className="text-sm font-semibold">Các bước ({rows.length})</div>
          <Button size="sm" variant="outline" onClick={add}>
            <Plus className="mr-1 h-4 w-4" /> Thêm bước
          </Button>
        </div>
        <div className="divide-y">
          {rows.map((r, i) => (
            <div key={i} className="grid gap-2 p-3 md:grid-cols-[40px_1fr_1fr_1fr_80px_1fr_40px] md:items-center">
              <div className="flex flex-col gap-1">
                <button className="text-xs" onClick={() => move(i, -1)}>▲</button>
                <button className="text-xs" onClick={() => move(i, 1)}>▼</button>
              </div>
              <Input placeholder="key (vd: visa_processing)" value={r.key} onChange={(e) => update(i, { key: e.target.value })} />
              <Input placeholder="Nhãn hiển thị" value={r.label} onChange={(e) => update(i, { label: e.target.value })} />
              <Input
                placeholder="role1,role2"
                value={r.role_required}
                onChange={(e) => update(i, { role_required: e.target.value })}
                title={`Roles hợp lệ: ${ROLE_OPTIONS.join(", ")}`}
              />
              <Input
                placeholder="SLA (giờ)"
                value={r.sla_hours}
                onChange={(e) => update(i, { sla_hours: e.target.value })}
              />
              <Input
                placeholder="next1,next2"
                value={r.next_steps}
                onChange={(e) => update(i, { next_steps: e.target.value })}
              />
              <Button size="icon" variant="ghost" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Chưa có bước nào</div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Gợi ý roles: {ROLE_OPTIONS.join(" · ")}. <code>next_steps</code> là danh sách <code>key</code> bước được phép chuyển tới.
      </p>
    </div>
  );
}
