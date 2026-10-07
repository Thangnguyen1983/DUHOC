import { errorMessage } from "@/lib/errors";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updatePlacement, canEditPlacement } from "@/lib/students.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  CONTRACT_CLASS,
  CONTRACT_LABEL,
  contractLevel,
  contractText,
  fmtDate,
} from "@/lib/students/placement";

type Profile = Record<string, any>;

const FIELDS: { key: string; label: string; type?: "date" | "number" | "textarea" }[] = [
  { key: "destination_country", label: "Nước đến" },
  { key: "destination_city", label: "Thành phố / tỉnh đến" },
  { key: "occupation", label: "Ngành nghề" },
  { key: "job_title", label: "Vị trí công việc" },
  { key: "employer_name", label: "Đơn vị tiếp nhận (trường / công ty)" },
  { key: "work_address", label: "Địa chỉ nơi làm việc", type: "textarea" },
  { key: "employer_contact_name", label: "Người liên hệ" },
  { key: "employer_contact_phone", label: "Điện thoại liên hệ" },
  { key: "employer_contact_email", label: "Email liên hệ" },
  { key: "departure_date", label: "Ngày xuất cảnh thực tế", type: "date" },
  { key: "contract_start_date", label: "Ngày bắt đầu hợp đồng", type: "date" },
  { key: "contract_end_date", label: "Ngày kết thúc hợp đồng", type: "date" },
  { key: "contract_duration_months", label: "Thời hạn (tháng)", type: "number" },
  { key: "contract_renewal_note", label: "Ghi chú gia hạn", type: "textarea" },
];

export function PlacementPanel({ profile }: { profile: Profile }) {
  const qc = useQueryClient();
  const save = useServerFn(updatePlacement);
  const checkPerm = useServerFn(canEditPlacement);
  const perm = useQuery({
    queryKey: ["can-edit-placement"],
    queryFn: () => checkPerm({ data: {} as never }),
  });
  const canEdit = perm.data?.allowed === true;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const f of FIELDS) next[f.key] = profile?.[f.key] == null ? "" : String(profile[f.key]);
    setForm(next);
  }, [profile]);

  const mut = useMutation({
    mutationFn: async () => {
      const patch: Record<string, any> = {};
      for (const f of FIELDS) {
        const v = (form[f.key] ?? "").trim();
        patch[f.key] = f.type === "number" ? (v === "" ? null : Number(v)) : v === "" ? null : v;
      }
      return save({ data: { id: profile.id, patch } });
    },
    onSuccess: () => {
      toast.success("Đã lưu thông tin nơi làm việc");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["student", profile.id] });
      qc.invalidateQueries({ queryKey: ["student"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Không lưu được")),
  });

  const level = contractLevel(profile?.contract_end_date);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Nơi đến học tập & làm việc</h3>
          {profile?.contract_end_date && (
            <Badge className={CONTRACT_CLASS[level]} variant="secondary">
              {CONTRACT_LABEL[level]} · {contractText(profile.contract_end_date)}
            </Badge>
          )}
        </div>
        {canEdit &&
          (editing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                Huỷ
              </Button>
              <Button size="sm" onClick={() => mut.mutate()} disabled={mut.isPending}>
                {mut.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1 h-4 w-4" />
                )}
                Lưu
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Sửa
            </Button>
          ))}
      </div>

      {!canEdit && (
        <p className="text-xs text-muted-foreground">
          Chỉ quản trị, cán bộ xuất cảnh và CSKH được sửa phần này.
        </p>
      )}

      {editing ? (
        <div className="grid gap-3 md:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
              <Label className="text-xs">{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  rows={2}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              ) : (
                <Input
                  type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <dl className="grid gap-x-6 gap-y-2 md:grid-cols-2">
          {FIELDS.map((f) => {
            const raw = profile?.[f.key];
            const val =
              f.type === "date" ? fmtDate(raw) : raw == null || raw === "" ? "—" : String(raw);
            return (
              <div key={f.key} className="flex gap-2 text-sm">
                <dt className="w-52 shrink-0 text-muted-foreground">{f.label}</dt>
                <dd className="font-medium break-words">{val}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}
