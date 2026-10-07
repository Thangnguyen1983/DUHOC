import { errorMessage } from "@/lib/errors";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2, Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listCampaigns,
  saveCampaign,
  deleteCampaign,
  campaignReport,
} from "@/lib/marketing/campaigns.functions";

export const Route = createFileRoute("/_authenticated/admin/marketing/campaigns")({ component: Page });

const empty = {
  name: "",
  code: "",
  channel: "facebook",
  market: "",
  landing_path: "/dang-ky",
  utm_source: "facebook",
  utm_medium: "cpc",
  utm_campaign: "",
  budget: null as number | null,
  lead_target: null as number | null,
  is_active: true,
};

function Page() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listCampaigns);
  const fetchReport = useServerFn(campaignReport);
  const save = useServerFn(saveCampaign);
  const del = useServerFn(deleteCampaign);

  const list = useQuery({ queryKey: ["campaigns"], queryFn: () => fetchList({}) });
  const report = useQuery({ queryKey: ["campaign-report"], queryFn: () => fetchReport({}) });
  const [editing, setEditing] = useState<any>(null);

  const saveMut = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: () => {
      toast.success("Đã lưu chiến dịch");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign-report"] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã xoá");
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const buildUrl = (c: any) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const p = new URLSearchParams();
    p.set("campaign", c.code);
    if (c.utm_source) p.set("utm_source", c.utm_source);
    if (c.utm_medium) p.set("utm_medium", c.utm_medium);
    p.set("utm_campaign", c.utm_campaign || c.code);
    return `${base}${c.landing_path || "/dang-ky"}?${p.toString()}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Megaphone className="h-6 w-6" /> Chiến dịch Marketing
          </h1>
          <p className="text-sm text-muted-foreground">Landing page, link UTM và báo cáo hiệu quả lead</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>
          <Plus className="mr-1 h-4 w-4" /> Tạo chiến dịch
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Tổng lead" value={report.data?.total_leads ?? 0} />
        <Kpi label="Chiến dịch đang chạy" value={(list.data?.items ?? []).filter((c: any) => c.is_active).length} />
        <Kpi label="Nguồn traffic" value={report.data?.sources?.length ?? 0} />
      </div>

      {editing && (
        <div className="grid gap-3 rounded-2xl border bg-card p-6 md:grid-cols-3">
          {[
            ["name", "Tên chiến dịch"],
            ["code", "Mã (slug)"],
            ["channel", "Kênh"],
            ["market", "Thị trường"],
            ["landing_path", "Đường dẫn landing"],
            ["utm_source", "utm_source"],
            ["utm_medium", "utm_medium"],
            ["utm_campaign", "utm_campaign"],
          ].map(([k, label]) => (
            <div key={k as string}>
              <Label>{label}</Label>
              <Input value={editing[k as string] ?? ""} onChange={(e) => setEditing({ ...editing, [k as string]: e.target.value })} />
            </div>
          ))}
          <div>
            <Label>Ngân sách (VND)</Label>
            <Input
              type="number"
              value={editing.budget ?? ""}
              onChange={(e) => setEditing({ ...editing, budget: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div>
            <Label>Mục tiêu lead</Label>
            <Input
              type="number"
              value={editing.lead_target ?? ""}
              onChange={(e) => setEditing({ ...editing, lead_target: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-3">
            <Button onClick={() => saveMut.mutate(editing)} disabled={saveMut.isPending}>Lưu</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Huỷ</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3">Chiến dịch</th>
              <th className="p-3">Kênh</th>
              <th className="p-3">Lead</th>
              <th className="p-3">Chuyển đổi</th>
              <th className="p-3">Chi phí/lead</th>
              <th className="p-3">Link UTM</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(report.data?.campaigns ?? []).map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.code}</div>
                </td>
                <td className="p-3">{c.channel ?? "—"}</td>
                <td className="p-3 font-semibold">
                  {c.leads}
                  {c.lead_target ? <span className="text-xs text-muted-foreground"> / {c.lead_target}</span> : null}
                </td>
                <td className="p-3">{c.conversion_rate}%</td>
                <td className="p-3">{c.cost_per_lead ? c.cost_per_lead.toLocaleString("vi-VN") + "đ" : "—"}</td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(buildUrl(c));
                      toast.success("Đã sao chép link");
                    }}
                  >
                    <Copy className="mr-1 h-4 w-4" /> Copy
                  </Button>
                </td>
                <td className="space-x-1 p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Xoá chiến dịch?") && delMut.mutate(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {!report.data?.campaigns?.length && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">Chưa có chiến dịch</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="mb-3 font-semibold">Lead theo nguồn</h2>
        <div className="flex flex-wrap gap-2">
          {(report.data?.sources ?? []).map((s: any) => (
            <span key={s.source} className="rounded-full bg-muted px-3 py-1 text-sm">
              {s.source}: <strong>{s.count}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
