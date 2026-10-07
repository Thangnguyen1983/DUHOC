import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listEmailTemplates,
  listTemplateVersions,
  saveTemplateVersion,
  activateTemplateVersion,
  deactivateTemplate,
} from "@/lib/email/templates-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings/emails")({
  component: EmailSettingsPage,
});

function EmailSettingsPage() {
  const list = useServerFn(listEmailTemplates);
  const { data } = useQuery({ queryKey: ["admin-email-templates"], queryFn: () => list() });
  const [selected, setSelected] = useState<string | null>(null);
  const items = data?.templates ?? [];
  const active = selected ?? items[0]?.name ?? null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tuỳ chỉnh email</h1>
        <p className="text-sm text-muted-foreground">
          Sửa tiêu đề và phần mở đầu email. Cấu trúc (danh sách khoá học, tổng tiền, nút thanh toán) được giữ nguyên tự động.
          Dùng biến trong ngoặc kép: <code>{"{{orderNo}}"}</code>, <code>{"{{customerName}}"}</code>...
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <Card className="p-3 space-y-1 h-fit">
          {items.map((t) => (
            <button
              key={t.name}
              onClick={() => setSelected(t.name)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                active === t.name ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <div className="font-medium">{t.displayName}</div>
              <div className="text-xs opacity-70 flex items-center gap-2">
                {t.name}
                {t.activeOverride && <Badge variant="secondary" className="text-[10px]">v{t.activeOverride.version} đang bật</Badge>}
              </div>
            </button>
          ))}
        </Card>

        {active && <TemplateEditor key={active} templateName={active} meta={items.find((t) => t.name === active)!} />}
      </div>
    </div>
  );
}

function TemplateEditor({ templateName, meta }: { templateName: string; meta: any }) {
  const qc = useQueryClient();
  const listVersions = useServerFn(listTemplateVersions);
  const save = useServerFn(saveTemplateVersion);
  const activate = useServerFn(activateTemplateVersion);
  const deactivate = useServerFn(deactivateTemplate);

  const { data } = useQuery({
    queryKey: ["email-tpl-versions", templateName],
    queryFn: () => listVersions({ data: { name: templateName } }),
  });
  const versions = data?.items ?? [];
  const active = meta.activeOverride;
  const [subject, setSubject] = useState<string>(active?.subject ?? String(meta.defaultSubject ?? ""));
  const [intro, setIntro] = useState<string>(active?.intro_markdown ?? "");
  const [note, setNote] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-email-templates"] });
    qc.invalidateQueries({ queryKey: ["email-tpl-versions", templateName] });
  };

  const saveMut = useMutation({
    mutationFn: (activate: boolean) =>
      save({ data: { name: templateName, subject, introMarkdown: intro, note: note || undefined, activate } }),
    onSuccess: (_, activate) => {
      toast.success(activate ? "Đã lưu và kích hoạt phiên bản mới" : "Đã lưu bản nháp");
      setNote("");
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lưu thất bại")),
  });
  const activateMut = useMutation({
    mutationFn: (id: string) => activate({ data: { id } }),
    onSuccess: () => { toast.success("Đã kích hoạt phiên bản"); invalidate(); },
  });
  const deactivateMut = useMutation({
    mutationFn: () => deactivate({ data: { name: templateName } }),
    onSuccess: () => { toast.success("Đã tắt tuỳ chỉnh — dùng bản mặc định"); invalidate(); },
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-muted-foreground">Biến có thể dùng:</span>
          {(meta.variables ?? []).map((v: string) => (
            <code key={v} className="bg-muted px-1.5 py-0.5 rounded">{`{{${v}}}`}</code>
          ))}
        </div>
        <div className="space-y-2">
          <Label>Tiêu đề email</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={String(meta.defaultSubject ?? "")} />
        </div>
        <div className="space-y-2">
          <Label>Phần mở đầu (Markdown)</Label>
          <Textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={10}
            placeholder={`Ví dụ:\n\nXin chào **{{customerName}}**, cảm ơn bạn đã đặt đơn #{{orderNo}}.\n\nVui lòng hoàn tất thanh toán trong 24 giờ để mở khoá học.`}
          />
          <p className="text-xs text-muted-foreground">
            Hỗ trợ: **đậm**, *nghiêng*, [link](https://...), xuống dòng. Cấu trúc bảng giá và nút thanh toán vẫn giữ tự động.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Ghi chú phiên bản (tuỳ chọn)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Đổi giọng thân thiện hơn" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => saveMut.mutate(true)} disabled={saveMut.isPending}>
            Lưu & kích hoạt
          </Button>
          <Button variant="outline" onClick={() => saveMut.mutate(false)} disabled={saveMut.isPending}>
            Lưu bản nháp
          </Button>
          {active && (
            <Button variant="ghost" onClick={() => deactivateMut.mutate()} disabled={deactivateMut.isPending}>
              Tắt tuỳ chỉnh (dùng mặc định)
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Lịch sử phiên bản</h3>
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có phiên bản nào.</p>
        ) : (
          <div className="space-y-2">
            {versions.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
                <div>
                  <div className="font-medium">
                    v{v.version} {v.is_active && <Badge className="ml-2">Đang bật</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleString("vi-VN")} · {v.subject}
                  </div>
                  {v.note && <div className="text-xs italic mt-1">{v.note}</div>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setSubject(v.subject); setIntro(v.intro_markdown); toast.info("Đã tải nội dung vào form — bấm Lưu để tạo bản mới"); }}>
                    Tải vào form
                  </Button>
                  {!v.is_active && (
                    <Button size="sm" onClick={() => activateMut.mutate(v.id)} disabled={activateMut.isPending}>
                      Kích hoạt
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
