import { errorMessage } from "@/lib/errors";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLeadQueue,
  autoDistributeLeads,
  claimLead,
  assignLeadTo,
  upsertSalesAgent,
  deleteSalesAgent,
} from "@/lib/leads/distribution.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shuffle, Trash2, UserPlus } from "lucide-react";
import { SalesKpiPanel } from "@/components/leads/sales-kpi-panel";


const ACTION_LABEL: Record<string, string> = {
  assign: "Giao tự động",
  manual_assign: "Giao thủ công",
  reassign: "Chuyển tiếp (quá hạn)",
  claim: "Nhận khách",
  release: "Thu hồi",
};

function fmt(d?: string | null) {
  return d ? new Date(d).toLocaleString("vi-VN") : "—";
}

export function LeadsQueue() {
  const qc = useQueryClient();
  const fetchQueue = useServerFn(getLeadQueue);
  const distribute = useServerFn(autoDistributeLeads);
  const claim = useServerFn(claimLead);
  const assign = useServerFn(assignLeadTo);
  const saveAgent = useServerFn(upsertSalesAgent);
  const removeAgent = useServerFn(deleteSalesAgent);

  const q = useQuery({ queryKey: ["lead-queue"], queryFn: () => fetchQueue() });
  const d = q.data;
  const refresh = () => qc.invalidateQueries({ queryKey: ["lead-queue"] });

  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [newAgent, setNewAgent] = useState({ user_id: "", markets: "", max_open_leads: 20, claim_minutes: 30 });

  const distributeMut = useMutation({
    mutationFn: () => distribute(),
    onSuccess: (r: any) => {
      toast.success(`Đã giao ${r.assigned} lead mới, chuyển tiếp ${r.reassigned} lead quá hạn`);
      refresh();
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const claimMut = useMutation({
    mutationFn: (id: string) => claim({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã nhận khách");
      refresh();
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const assignMut = useMutation({
    mutationFn: (p: { id: string; user_id: string | null }) => assign({ data: p }),
    onSuccess: () => {
      toast.success("Đã cập nhật người phụ trách");
      refresh();
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const agentMut = useMutation({
    mutationFn: (p: any) => saveAgent({ data: p }),
    onSuccess: () => {
      toast.success("Đã lưu nhân sự telesales");
      setNewAgent({ user_id: "", markets: "", max_open_leads: 20, claim_minutes: 30 });
      refresh();
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delAgentMut = useMutation({
    mutationFn: (id: string) => removeAgent({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã gỡ khỏi hàng đợi");
      refresh();
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const leads = useMemo(() => {
    let list = d?.leads ?? [];
    if (onlyMine) list = list.filter((l: any) => l.assigned_to === d?.me);
    const s = search.trim().toLowerCase();
    if (s)
      list = list.filter((l: any) =>
        [l.full_name, l.phone, l.email, l.market, l.program].some((v: any) => (v ?? "").toLowerCase().includes(s)),
      );
    return list;
  }, [d, search, onlyMine]);

  const unassigned = (d?.leads ?? []).filter((l: any) => !l.assigned_to).length;
  const overdue = (d?.leads ?? []).filter(
    (l: any) => l.assigned_to && !l.claimed_at && l.claim_deadline && new Date(l.claim_deadline) < new Date(),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Phân phối lead telesales</h2>
          <p className="text-sm text-muted-foreground">
            Giao lead luân phiên theo thị trường và tải hiện tại, nhân viên bấm "Nhận khách" để khoá lead; quá hạn tự
            chuyển sang người khác.
          </p>
        </div>
        {d?.isManager && (
          <Button onClick={() => distributeMut.mutate()} disabled={distributeMut.isPending}>
            <Shuffle className="mr-2 h-4 w-4" /> Phân phối tự động
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi title="Tổng lead" value={d?.leads?.length ?? 0} />
        <Kpi title="Chưa giao" value={unassigned} tone="text-amber-600" />
        <Kpi title="Quá hạn nhận" value={overdue} tone="text-destructive" />
        <Kpi title="Nhân sự đang bật" value={(d?.agents ?? []).filter((a: any) => a.is_active).length} />
      </div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Hàng đợi lead</TabsTrigger>
          {d?.isManager && <TabsTrigger value="agents">Nhân sự telesales</TabsTrigger>}
          {d?.isManager && <TabsTrigger value="kpi">KPI telesales</TabsTrigger>}
          <TabsTrigger value="logs">Nhật ký phân phối</TabsTrigger>
        </TabsList>

        {d?.isManager && (
          <TabsContent value="kpi">
            <SalesKpiPanel />
          </TabsContent>
        )}


        <TabsContent value="leads" className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Tìm theo tên, SĐT, email, thị trường…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={onlyMine} onCheckedChange={setOnlyMine} /> Chỉ lead của tôi
            </label>
          </div>

          <div className="rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-2">Khách hàng</th>
                  <th className="p-2">Chương trình</th>
                  <th className="p-2">Phụ trách</th>
                  <th className="p-2">Hạn nhận</th>
                  <th className="p-2">Trạng thái</th>
                  <th className="p-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l: any) => {
                  const isOverdue = l.assigned_to && !l.claimed_at && l.claim_deadline && new Date(l.claim_deadline) < new Date();
                  return (
                    <tr key={l.id} className="border-t align-top">
                      <td className="p-2">
                        <div className="font-medium">{l.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {l.phone} {l.email ? `· ${l.email}` : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">{fmt(l.created_at)}</div>
                      </td>
                      <td className="p-2">
                        {l.program}
                        {l.market && <div className="text-xs text-muted-foreground">{l.market}</div>}
                      </td>
                      <td className="p-2">
                        {l.assigned_name ?? (l.assigned_to ? l.assigned_to.slice(0, 8) : "—")}
                        {l.claimed_at && <div className="text-xs text-emerald-600">Đã nhận {fmt(l.claimed_at)}</div>}
                        {l.reassign_count > 0 && (
                          <div className="text-xs text-muted-foreground">Chuyển tiếp {l.reassign_count} lần</div>
                        )}
                      </td>
                      <td className="p-2">
                        <span className={isOverdue ? "text-destructive font-medium" : ""}>{fmt(l.claim_deadline)}</span>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{l.status}</Badge>
                      </td>
                      <td className="p-2 text-right space-x-2 whitespace-nowrap">
                        {!l.claimed_at && (
                          <Button size="sm" variant="secondary" onClick={() => claimMut.mutate(l.id)}>
                            Nhận khách
                          </Button>
                        )}
                        {d?.isManager && (
                          <select
                            className="h-8 rounded-md border bg-background px-2 text-xs"
                            value={l.assigned_to ?? ""}
                            onChange={(e) => assignMut.mutate({ id: l.id, user_id: e.target.value || null })}
                          >
                            <option value="">— Chưa giao —</option>
                            {(d?.agents ?? []).map((a: any) => (
                              <option key={a.user_id} value={a.user_id}>
                                {a.user_name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!leads.length && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      Không có lead phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {d?.isManager && (
          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thêm nhân sự vào hàng đợi</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-5">
                <Input
                  placeholder="User ID (từ Tài khoản)"
                  value={newAgent.user_id}
                  onChange={(e) => setNewAgent({ ...newAgent, user_id: e.target.value })}
                  className="md:col-span-2"
                />
                <Input
                  placeholder="Thị trường (Đức, Hàn…)"
                  value={newAgent.markets}
                  onChange={(e) => setNewAgent({ ...newAgent, markets: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Tối đa lead"
                  value={newAgent.max_open_leads}
                  onChange={(e) => setNewAgent({ ...newAgent, max_open_leads: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Phút nhận khách"
                  value={newAgent.claim_minutes}
                  onChange={(e) => setNewAgent({ ...newAgent, claim_minutes: Number(e.target.value) })}
                />
                <Button
                  className="md:col-span-5 md:w-fit"
                  onClick={() =>
                    agentMut.mutate({
                      user_id: newAgent.user_id.trim(),
                      markets: newAgent.markets
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                      max_open_leads: newAgent.max_open_leads,
                      claim_minutes: newAgent.claim_minutes,
                      is_active: true,
                    })
                  }
                  disabled={!newAgent.user_id.trim() || agentMut.isPending}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Thêm vào hàng đợi
                </Button>
              </CardContent>
            </Card>

            <div className="rounded-xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-2">Nhân sự</th>
                    <th className="p-2">Thị trường</th>
                    <th className="p-2">Tối đa lead</th>
                    <th className="p-2">Hạn nhận (phút)</th>
                    <th className="p-2">Nhận lead</th>
                    <th className="p-2 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {(d?.agents ?? []).map((a: any) => (
                    <tr key={a.id} className="border-t">
                      <td className="p-2">
                        <div className="font-medium">{a.user_name}</div>
                        <div className="text-xs text-muted-foreground">Mã: {a.collaborator_code ?? "Chưa cấp"}</div>
                        <div className="text-xs text-muted-foreground">Giao gần nhất: {fmt(a.last_assigned_at)}</div>
                      </td>
                      <td className="p-2">{a.markets?.length ? a.markets.join(", ") : "Tất cả"}</td>
                      <td className="p-2">{a.max_open_leads}</td>
                      <td className="p-2">{a.claim_minutes}</td>
                      <td className="p-2">
                        <Switch
                          checked={a.is_active}
                          onCheckedChange={(v) =>
                            agentMut.mutate({
                              id: a.id,
                              user_id: a.user_id,
                              markets: a.markets ?? [],
                              max_open_leads: a.max_open_leads,
                              claim_minutes: a.claim_minutes,
                              is_active: v,
                            })
                          }
                        />
                      </td>
                      <td className="p-2 text-right">
                        <Button size="icon" variant="ghost" onClick={() => delAgentMut.mutate(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!(d?.agents ?? []).length && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        Chưa có nhân sự nào trong hàng đợi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}

        <TabsContent value="logs">
          <div className="rounded-xl border divide-y">
            {(d?.logs ?? []).map((g: any) => (
              <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span>
                  <Badge variant="outline" className="mr-2">
                    {ACTION_LABEL[g.action] ?? g.action}
                  </Badge>
                  {g.from_name ? `${g.from_name} → ` : ""}
                  {g.to_name ?? "—"}
                  {g.reason && <span className="ml-2 text-muted-foreground">({g.reason})</span>}
                </span>
                <span className="text-xs text-muted-foreground">{fmt(g.created_at)}</span>
              </div>
            ))}
            {!(d?.logs ?? []).length && <div className="p-6 text-center text-muted-foreground">Chưa có nhật ký.</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ title, value, tone }: { title: string; value: number | string; tone?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className={`text-2xl font-bold ${tone ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
