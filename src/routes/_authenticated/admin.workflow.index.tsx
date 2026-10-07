import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listInstances, getActiveDefinition } from "@/lib/workflow/workflow.functions";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/workflow/")({
  component: WorkflowKanban,
});

function WorkflowKanban() {
  const fetchInstances = useServerFn(listInstances);
  const fetchDef = useServerFn(getActiveDefinition);
  const instances = useQuery({ queryKey: ["wf-instances"], queryFn: () => fetchInstances() });
  const def = useQuery({ queryKey: ["wf-active-def"], queryFn: () => fetchDef() });

  const steps: Array<{ key: string; label: string }> = (def.data?.definition as any)?.steps ?? [];
  const groups: Record<string, any[]> = {};
  steps.forEach((s) => (groups[s.key] = []));
  (instances.data?.items ?? []).forEach((inst: any) => {
    if (!groups[inst.current_step]) groups[inst.current_step] = [];
    groups[inst.current_step].push(inst);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow — Quy trình 18 bước</h1>
          <p className="text-sm text-muted-foreground">
            {def.data?.definition
              ? `Đang dùng: ${(def.data.definition as any).name} v${(def.data.definition as any).version}`
              : "Chưa kích hoạt quy trình"}
          </p>
        </div>
        <Link
          to="/admin/workflow/config"
          className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm hover:bg-muted"
        >
          <Settings className="h-4 w-4" /> Cấu hình
        </Link>
      </div>

      {steps.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          Chưa có định nghĩa workflow nào được kích hoạt.
        </div>
      ) : (
        <div className="grid gap-3 overflow-x-auto pb-4" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(220px, 1fr))` }}>
          {steps.map((s) => (
            <div key={s.key} className="rounded-xl border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">{s.label}</div>
                <span className="rounded-full bg-card px-2 text-xs">{groups[s.key]?.length ?? 0}</span>
              </div>
              <div className="space-y-2">
                {(groups[s.key] ?? []).map((inst: any) => (
                  <div key={inst.id} className="rounded-lg border bg-card p-2 text-xs">
                    <div className="font-medium">{inst.student_profiles?.full_name ?? "—"}</div>
                    <div className="text-muted-foreground">
                      {inst.student_profiles?.phone ?? ""} • {inst.student_profiles?.program ?? ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
