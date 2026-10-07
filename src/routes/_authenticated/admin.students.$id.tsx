import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DeleteStudentDialog } from "@/components/students/delete-student-dialog";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getStudent,
  updateStudent,
  addCareLog,
  addDocument,
  verifyDocument,
  signDocumentUrl,
  ocrIdentityDoc,
  applyOcrToProfile,
  listStudentDepartments,
  assignStudentDepartment,
} from "@/lib/students.functions";
import { advanceWorkflow } from "@/lib/workflow/workflow.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentTranscript } from "@/components/training/student-transcript";
import { DocumentChecklistPanel } from "@/components/students/document-checklist-panel";
import { DossierAiPanel } from "@/components/students/dossier-ai-panel";

import { StudentReviewsPanel } from "@/components/students/student-reviews-panel";
import { Export360Dialog } from "@/components/students/export-360-dialog";
import { PlacementPanel } from "@/components/students/placement-panel";
import { AddressPanel, fullAddressOf } from "@/components/students/address-panel";
import { ArchivePanel } from "@/components/students/archive-panel";
import { ActivityTimeline } from "@/components/students/activity-timeline";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, CheckCircle2, XCircle, Upload, FileText, ScanLine, Loader2, Wand2, Copy } from "lucide-react";
import { toast } from "sonner";
import { StudentCommissionsPanel } from "@/components/commissions/student-commissions-panel";

export const Route = createFileRoute("/_authenticated/admin/students/$id")({
  head: () => ({ meta: [
    { title: "Chi tiết học viên — KAIZEN" },
    { name: "description", content: "Theo dõi và cập nhật hồ sơ học viên KAIZEN." },
    { property: "og:title", content: "Chi tiết học viên — KAIZEN" },
    { property: "og:description", content: "Theo dõi và cập nhật hồ sơ học viên KAIZEN." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: StudentDetailPage,
});

const STATUS_LABEL: Record<string, string> = {
  lead_new: "Lead mới",
  lead_contacted: "Đã liên hệ",
  consulting: "Đang tư vấn",
  profile_created: "Đã tạo hồ sơ",
  contract_pending: "Chờ ký HĐ",
  contract_signed: "Đã ký HĐ",
  class_pending: "Chờ xếp lớp",
  training: "Đang đào tạo",
  exam_pending: "Chờ thi",
  training_passed: "Đạt đào tạo",
  transfer_visa: "Chuyển Visa",
  visa_processing: "Đang xử lý visa",
  visa_granted: "Có visa",
  departure_pending: "Chờ xuất cảnh",
  departed: "Đã xuất cảnh",
  post_departure: "Hậu xuất cảnh",
  completed: "Hoàn thành",
  paused: "Tạm dừng",
  cancelled: "Đã huỷ",
};

const CHANNEL_LABEL: Record<string, string> = {
  call: "📞 Gọi điện",
  zalo: "💬 Zalo",
  email: "✉️ Email",
  sms: "📱 SMS",
  meeting: "🤝 Gặp mặt",
  other: "📝 Khác",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function StudentDetailPage() {
  const { id } = Route.useParams();
  const fetchStudent = useServerFn(getStudent);
  const updateFn = useServerFn(updateStudent);
  const departmentsFn = useServerFn(listStudentDepartments);
  const assignFn = useServerFn(assignStudentDepartment);
  const advanceFn = useServerFn(advanceWorkflow);
  const careFn = useServerFn(addCareLog);
  const docFn = useServerFn(addDocument);
  const verifyFn = useServerFn(verifyDocument);
  const signFn = useServerFn(signDocumentUrl);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-student", id],
    queryFn: () => fetchStudent({ data: { id } }),
  });
  const { data: departments } = useQuery({ queryKey: ["student-departments"], queryFn: () => departmentsFn() });
  const assignMut = useMutation({
    mutationFn: (department_id: string) => assignFn({ data: { id, department_id } }),
    onSuccess: () => { toast.success("Đã phân công phòng ban"); invalidate(); },
    onError: (e: any) => toast.error(errorMessage(e, "Không thể phân công")),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-student", id] });

  const updateMut = useMutation({
    mutationFn: (payload: any) => {
      const { __meta, ...patch } = payload ?? {};
      return updateFn({ data: { id, patch, meta_patch: __meta } });
    },
    onSuccess: () => {
      toast.success("Đã lưu");
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });
  const advanceMut = useMutation({
    mutationFn: (vars: { to_step: string; note: string }) =>
      advanceFn({ data: { student_profile_id: id, to_step: vars.to_step, note: vars.note } }),
    onSuccess: () => {
      toast.success("Đã chuyển bước");
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Không chuyển được")),
  });
  const careMut = useMutation({
    mutationFn: (v: { channel: any; content: string }) =>
      careFn({ data: { student_profile_id: id, channel: v.channel, content: v.content } }),
    onSuccess: () => {
      toast.success("Đã ghi nhật ký");
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });
  const docMut = useMutation({
    mutationFn: (v: any) => docFn({ data: { ...v, student_profile_id: id } }),
    onSuccess: () => {
      toast.success("Đã tải lên");
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });
  const verifyMut = useMutation({
    mutationFn: (v: { id: string; verified: boolean }) => verifyFn({ data: v }),
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="p-6">Đang tải...</div>;
  if (!data) return <div className="p-6">Không tìm thấy hồ sơ</div>;

  const p = data.profile as any;
  const steps = ((data.instance as any)?.workflow_definitions?.steps ?? []) as Array<any>;
  const currentStep = data.instance?.current_step ?? p.current_status;
  const currentDef = steps.find((s) => s.key === currentStep);
  const nextSteps: string[] = currentDef?.next_steps ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Danh sách
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{p.full_name}</h1>
            {p.student_code && (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(p.student_code);
                  toast.success("Đã sao chép mã học viên");
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-sm font-semibold text-primary hover:bg-primary/20"
                title="Sao chép mã học viên"
              >
                {p.student_code}
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{p.phone}</span>
            {p.email && <span>· {p.email}</span>}
            <Badge variant="outline">{STATUS_LABEL[currentStep] ?? currentStep}</Badge>
          </div>
          {(fullAddressOf(p, "residence") || fullAddressOf(p, "current") || fullAddressOf(p, "origin")) && (
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              {fullAddressOf(p, "residence") && (
                <span><span className="font-medium">Thường trú:</span> {fullAddressOf(p, "residence")}</span>
              )}
              {fullAddressOf(p, "current") && (
                <span><span className="font-medium">Nơi ở hiện tại:</span> {fullAddressOf(p, "current")}</span>
              )}
              {fullAddressOf(p, "origin") && (
                <span><span className="font-medium">Quê quán:</span> {fullAddressOf(p, "origin")}</span>
              )}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Export360Dialog studentProfileId={id} />
          <DeleteStudentDialog
            studentId={id}
            studentCode={p.student_code}
            fullName={p.full_name}
            onDeleted={() => navigate({ to: "/admin/students" })}
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">1. Tổng quan</TabsTrigger>
          <TabsTrigger value="care">2. CSKH ({data.careLogs.length})</TabsTrigger>
          <TabsTrigger value="checklist">3. Checklist hồ sơ</TabsTrigger>
          <TabsTrigger value="docs">4. Tài liệu ({data.documents.length})</TabsTrigger>
          <TabsTrigger value="classes">5. Lớp học ({data.enrollments.length})</TabsTrigger>
          <TabsTrigger value="transcript">6. Học bạ tổng hợp</TabsTrigger>
          <TabsTrigger value="reviews">7. Nhận xét & Kỷ luật</TabsTrigger>
          <TabsTrigger value="placement">8. Nơi làm việc</TabsTrigger>
          <TabsTrigger value="archive">9. Kho lưu trữ</TabsTrigger>
          <TabsTrigger value="history">10. Nhật ký & trách nhiệm</TabsTrigger>
          <TabsTrigger value="commission">11. CTV & Hoa hồng</TabsTrigger>
        </TabsList>

        {/* TAB 1: TỔNG QUAN */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <form
              className="rounded-lg border p-5 space-y-4 bg-card"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                updateMut.mutate({
                  full_name: String(fd.get("full_name") || ""),
                  phone: String(fd.get("phone") || ""),
                  email: (fd.get("email") as string) || null,
                  dob: (fd.get("dob") as string) || null,
                  country: (fd.get("country") as string) || null,
                  program: (fd.get("program") as string) || null,
                  program_type: ((fd.get("program_type") as string) || null) as any,
                });
              }}
            >
              <h2 className="font-semibold">Thông tin cá nhân</h2>
              {departments?.canAssign && (
                <div>
                  <Label htmlFor="student-department">Phòng ban quản lý</Label>
                  <select id="student-department" value={p.department_id ?? ""}
                    onChange={(e) => { if (e.target.value) assignMut.mutate(e.target.value); }}
                    disabled={assignMut.isPending}
                    className="h-10 w-full rounded-md border bg-background px-2 text-sm">
                    <option value="">Chưa phân công — chỉ Ban Giám đốc xem</option>
                    {departments.items.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Họ tên</Label>
                  <Input name="full_name" defaultValue={p.full_name} />
                </div>
                <div>
                  <Label>SĐT</Label>
                  <Input name="phone" defaultValue={p.phone} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" defaultValue={p.email ?? ""} />
                </div>
                <div>
                  <Label>Ngày sinh</Label>
                  <Input name="dob" type="date" defaultValue={p.dob ?? ""} />
                </div>
                <div>
                  <Label>Thị trường</Label>
                  <Input name="country" defaultValue={p.country ?? ""} />
                </div>
                <div>
                  <Label>Chương trình</Label>
                  <Input name="program" defaultValue={p.program ?? ""} />
                </div>
                <div>
                  <Label>Loại chương trình</Label>
                  <select
                    name="program_type"
                    className="h-10 w-full rounded-md border bg-background px-2 text-sm"
                    defaultValue={(p as any).program_type ?? ""}
                  >
                    <option value="">— Chưa xác định —</option>
                    <option value="du_hoc">Du học</option>
                    <option value="xkld">XKLĐ</option>
                    <option value="thuc_tap_sinh">Thực tập sinh</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={updateMut.isPending}>
                <Save className="h-4 w-4 mr-1" />
                {updateMut.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </form>

            <div className="rounded-lg border p-5 space-y-4 bg-card">
              <h2 className="font-semibold">Workflow</h2>
              <div>
                <div className="text-xs text-muted-foreground">Bước hiện tại</div>
                <div className="text-lg font-medium">
                  {STATUS_LABEL[currentStep] ?? currentStep}
                </div>
              </div>
              {nextSteps.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Không có bước tiếp theo (đã hoàn tất hoặc đã huỷ).
                </div>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget as HTMLFormElement);
                    const to_step = String(fd.get("to_step") || "");
                    const note = String(fd.get("note") || "");
                    if (!to_step) return;
                    advanceMut.mutate({ to_step, note });
                  }}
                >
                  <div>
                    <Label>Chuyển sang bước</Label>
                    <select
                      name="to_step"
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        — Chọn bước —
                      </option>
                      {nextSteps.map((k) => (
                        <option key={k} value={k}>
                          {STATUS_LABEL[k] ?? k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Ghi chú</Label>
                    <Textarea name="note" rows={2} placeholder="Lý do, bằng chứng..." />
                  </div>
                  <Button type="submit" disabled={advanceMut.isPending}>
                    {advanceMut.isPending ? "Đang xử lý..." : "Chuyển bước"}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Trạng thái phụ — Nguồn / HĐ / Visa / Xuất cảnh */}
          <form
            className="rounded-lg border bg-card p-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              updateMut.mutate({
                source: (fd.get("source") as string) || null,
                contract_status: (fd.get("contract_status") as string) || null,
                visa_status: (fd.get("visa_status") as string) || null,
                departure_status: (fd.get("departure_status") as string) || null,
                post_departure_status: (fd.get("post_departure_status") as string) || null,
              });
            }}
          >
            <h2 className="font-semibold">Trạng thái phụ</h2>
            <div className="grid md:grid-cols-5 gap-3">
              <div>
                <Label>Nguồn đăng ký</Label>
                <Input name="source" defaultValue={p.source ?? ""} placeholder="facebook, zalo, hotline..." />
              </div>
              <div>
                <Label>Hợp đồng</Label>
                <select name="contract_status" defaultValue={p.contract_status ?? ""} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="">—</option>
                  <option value="draft">Soạn thảo</option>
                  <option value="sent">Đã gửi HV</option>
                  <option value="signed">Đã ký</option>
                  <option value="cancelled">Huỷ</option>
                </select>
              </div>
              <div>
                <Label>Visa</Label>
                <select name="visa_status" defaultValue={p.visa_status ?? ""} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="">—</option>
                  <option value="preparing">Chuẩn bị HS</option>
                  <option value="submitted">Đã nộp</option>
                  <option value="interview">Phỏng vấn</option>
                  <option value="granted">Đã cấp</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>
              <div>
                <Label>Xuất cảnh</Label>
                <select name="departure_status" defaultValue={p.departure_status ?? ""} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="">—</option>
                  <option value="booking">Đặt vé</option>
                  <option value="ticket_issued">Có vé</option>
                  <option value="departed">Đã bay</option>
                </select>
              </div>
              <div>
                <Label>Hậu xuất cảnh</Label>
                <select name="post_departure_status" defaultValue={p.post_departure_status ?? ""} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="">—</option>
                  <option value="settling">Đang ổn định</option>
                  <option value="working">Đang làm việc</option>
                  <option value="completed">Kết thúc HĐ</option>
                </select>
              </div>
            </div>
            <Button type="submit" size="sm" disabled={updateMut.isPending}>
              <Save className="h-4 w-4 mr-1" /> Lưu trạng thái phụ
            </Button>
          </form>

          {/* Nơi ở & địa bàn — chọn từ danh mục địa giới hành chính */}
          <AddressPanel studentId={id} profile={p} />
        </TabsContent>

        {/* TAB 2: NHẬT KÝ & TRÁCH NHIỆM */}
        <TabsContent value="history">
          <ActivityTimeline studentProfileId={id} />
        </TabsContent>


        {/* TAB 3: CARE LOGS */}
        <TabsContent value="care" className="space-y-4">
          <form
            className="rounded-lg border bg-card p-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              const channel = String(fd.get("channel") || "call");
              const content = String(fd.get("content") || "").trim();
              if (!content) return;
              careMut.mutate({ channel, content });
              (e.currentTarget as HTMLFormElement).reset();
            }}
          >
            <div className="flex gap-3">
              <Select name="channel" defaultValue="call">
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHANNEL_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input name="channel" type="hidden" />
            </div>
            <Textarea name="content" rows={2} placeholder="Nội dung trao đổi..." required />
            <Button type="submit" disabled={careMut.isPending}>
              Ghi nhật ký
            </Button>
          </form>
          <div className="rounded-lg border bg-card divide-y">
            {data.careLogs.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">Chưa có ghi chú CSKH</div>
            )}
            {data.careLogs.map((l: any) => (
              <div key={l.id} className="p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{CHANNEL_LABEL[l.channel] ?? l.channel}</span>
                  <span>{new Date(l.created_at).toLocaleString("vi-VN")}</span>
                </div>
                <div className="mt-1 text-sm whitespace-pre-wrap">{l.content}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: DOCUMENTS */}
        <TabsContent value="docs" className="space-y-4">
          <OcrPanel studentId={id} profile={p} onSaved={invalidate} />
          <form
            className="rounded-lg border bg-card p-4 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const fd = new FormData(form);
              const file = fd.get("file") as File | null;
              const doc_type = String(fd.get("doc_type") || "other");
              const note = String(fd.get("note") || "");
              if (!file || !file.size) {
                toast.error("Chọn file");
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                toast.error("Tối đa 5MB");
                return;
              }
              const base64 = await fileToBase64(file);
              docMut.mutate({
                doc_type,
                file_name: file.name,
                mime: file.type || "application/octet-stream",
                base64,
                note,
              });
              form.reset();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Loại tài liệu</Label>
                <select
                  name="doc_type"
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  defaultValue="cccd"
                >
                  <option value="cccd">CCCD/CMND</option>
                  <option value="passport">Hộ chiếu</option>
                  <option value="hoc_ba">Học bạ</option>
                  <option value="bang_cap">Bằng cấp</option>
                  <option value="visa">Visa</option>
                  <option value="contract">Hợp đồng</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <Label>File (≤ 5MB)</Label>
                <Input name="file" type="file" accept=".pdf,image/*" required />
              </div>
              <div>
                <Label>Ghi chú</Label>
                <Input name="note" />
              </div>
            </div>
            <Button type="submit" disabled={docMut.isPending}>
              <Upload className="h-4 w-4 mr-1" />
              {docMut.isPending ? "Đang tải..." : "Tải lên"}
            </Button>
          </form>

          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Loại</th>
                  <th className="px-4 py-2 font-medium">Tên file</th>
                  <th className="px-4 py-2 font-medium">Xác minh</th>
                  <th className="px-4 py-2 font-medium">Ngày tải</th>
                  <th className="px-4 py-2 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {data.documents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      Chưa có tài liệu
                    </td>
                  </tr>
                )}
                {data.documents.map((d: any) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-4 py-2">{d.doc_type}</td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {d.file_name}
                    </td>
                    <td className="px-4 py-2">
                      {d.verified ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          Đã xác minh
                        </Badge>
                      ) : (
                        <Badge variant="outline">Chưa</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await signFn({ data: { path: d.file_path } });
                            window.open(res.url, "_blank");
                          } catch (e: any) {
                            toast.error(errorMessage(e, "Không mở được"));
                          }
                        }}
                      >
                        Xem
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verifyMut.mutate({ id: d.id, verified: !d.verified })}
                      >
                        {d.verified ? (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Bỏ xác minh
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Xác minh
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* TAB 5: CLASSES */}
        <TabsContent value="classes">
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Mã lớp</th>
                  <th className="px-4 py-2 font-medium">Tên lớp</th>
                  <th className="px-4 py-2 font-medium">Thời gian</th>
                  <th className="px-4 py-2 font-medium">Trạng thái</th>
                  <th className="px-4 py-2 font-medium">Điểm cuối</th>
                </tr>
              </thead>
              <tbody>
                {data.enrollments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      Chưa đăng ký lớp nào
                    </td>
                  </tr>
                )}
                {data.enrollments.map((e: any) => {
                  const c = e.training_classes;
                  return (
                    <tr key={e.id} className="border-t">
                      <td className="px-4 py-2 font-mono text-xs">{c?.code}</td>
                      <td className="px-4 py-2">{c?.name}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {c?.start_date} → {c?.end_date}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">{e.status}</Badge>
                      </td>
                      <td className="px-4 py-2">{e.final_grade ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="placement">
          <PlacementPanel profile={data.profile} />
        </TabsContent>

        <TabsContent value="commission">
          <StudentCommissionsPanel studentProfileId={id} />
        </TabsContent>

        <TabsContent value="archive">
          <ArchivePanel studentProfileId={id} />
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <DocumentChecklistPanel studentProfileId={id} />
          <DossierAiPanel studentProfileId={id} />
        </TabsContent>


        <TabsContent value="reviews">
          <StudentReviewsPanel studentProfileId={id} />
        </TabsContent>

        <TabsContent value="transcript">
          <StudentTranscript studentProfileId={id} />
        </TabsContent>

      </Tabs>
    </div>
  );
}

type OcrFields = Partial<{
  full_name: string;
  dob: string;
  gender: string;
  nationality: string;
  id_type: string;
  id_no: string;
  id_issue_date: string;
  id_issue_place: string;
  id_expiry_date: string;
  place_of_origin: string;
  place_of_residence: string;
}>;

const OCR_FIELD_DEFS = [
  ["full_name", "Họ tên", "text"],
  ["dob", "Ngày sinh", "date"],
  ["gender", "Giới tính", "text"],
  ["nationality", "Quốc tịch", "text"],
  ["id_type", "Loại giấy tờ", "text"],
  ["id_no", "Số giấy tờ", "text"],
  ["id_issue_date", "Ngày cấp", "date"],
  ["id_issue_place", "Nơi cấp", "text"],
  ["id_expiry_date", "Hết hạn", "date"],
  ["place_of_origin", "Quê quán", "text"],
  ["place_of_residence", "Thường trú", "text"],
] as const;

/** Chuyển JSON OCR gốc sang đúng tên cột của hồ sơ học viên. */
function mapOcrToColumns(raw: Record<string, any>): OcrFields {
  return {
    full_name: raw.full_name || "",
    dob: raw.dob || "",
    gender: raw.gender || "",
    nationality: raw.nationality || "",
    id_type: raw.document_type || "",
    id_no: raw.document_no || "",
    id_issue_date: raw.issue_date || "",
    id_issue_place: raw.issue_place || "",
    id_expiry_date: raw.expiry_date || "",
    place_of_origin: raw.place_of_origin || "",
    place_of_residence: raw.place_of_residence || "",
  };
}

function OcrPanel({
  studentId,
  profile,
  onSaved,
}: {
  studentId: string;
  profile: any;
  onSaved: () => void;
}) {
  const ocrFn = useServerFn(ocrIdentityDoc);
  const applyFn = useServerFn(applyOcrToProfile);
  const [scanning, setScanning] = useState(false);
  const [fields, setFields] = useState<OcrFields | null>(null);
  const [raw, setRaw] = useState<Record<string, any> | null>(null);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [docType, setDocType] = useState<"passport" | "cccd" | "cmnd" | "other">("passport");

  const saveMut = useMutation({
    mutationFn: () => {
      const chosen: Record<string, string> = {};
      for (const [key] of OCR_FIELD_DEFS) {
        if (picked[key] && (fields?.[key] ?? "")) chosen[key] = String(fields?.[key]);
      }
      return applyFn({ data: { id: studentId, fields: chosen, raw: raw ?? undefined } });
    },
    onSuccess: (r: any) => {
      toast.success(`Đã lưu ${r?.applied?.length ?? 0} trường vào hồ sơ`);
      setFields(null);
      setRaw(null);
      setPicked({});
      onSaved();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Không lưu được")),
  });

  const onPick = async (file: File) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error("Chỉ hỗ trợ ảnh JPG/PNG/WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tối đa 5MB");
      return;
    }
    setScanning(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await ocrFn({
        data: {
          base64,
          mime: file.type as "image/jpeg" | "image/png" | "image/webp",
          doc_type: docType,
        },
      });
      const rawFields = (res.fields ?? {}) as Record<string, any>;
      const mapped = mapOcrToColumns(rawFields);
      setRaw(rawFields);
      setFields(mapped);
      // Mặc định tick sẵn các trường hồ sơ còn trống, trường đã có giá trị thì để người dùng tự quyết định.
      const next: Record<string, boolean> = {};
      for (const [key] of OCR_FIELD_DEFS) {
        const newVal = (mapped[key] ?? "").toString().trim();
        const oldVal = (profile?.[key] ?? "").toString().trim();
        next[key] = Boolean(newVal) && !oldVal;
      }
      setPicked(next);
      toast.success("Đã đọc xong giấy tờ — hãy đối chiếu trước khi lưu");
    } catch (e: any) {
      toast.error(errorMessage(e, "OCR thất bại"));
    } finally {
      setScanning(false);
    }
  };

  const selectedCount = OCR_FIELD_DEFS.filter(([k]) => picked[k] && fields?.[k]).length;

  return (
    <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <ScanLine className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="font-semibold text-sm">Quét OCR Hộ chiếu / CCCD / CMND</div>
          <div className="text-xs text-muted-foreground">
            Đọc ảnh giấy tờ, đối chiếu với dữ liệu đang có rồi lưu vào hồ sơ (không tự ghi đè).
          </div>
        </div>
        {profile?.ocr_at && (
          <span className="text-[11px] text-muted-foreground">
            Lần quét gần nhất: {new Date(profile.ocr_at).toLocaleString("vi-VN")}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs">Loại GT</Label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as any)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="passport">Hộ chiếu</option>
            <option value="cccd">CCCD</option>
            <option value="cmnd">CMND</option>
            <option value="other">Khác</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Ảnh giấy tờ (JPG/PNG/WebP, ≤5MB)</Label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={scanning}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPick(f);
              e.currentTarget.value = "";
            }}
          />
        </div>
        {scanning && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang đọc...
          </div>
        )}
      </div>

      {fields && (
        <div className="rounded-md border bg-card p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium">Đối chiếu trước khi lưu</div>
            <span className="text-[11px] text-muted-foreground">
              Tick những dòng muốn ghi đè vào hồ sơ. Có thể sửa trực tiếp giá trị OCR.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 w-10">Lưu</th>
                  <th className="px-3 py-2 font-medium">Trường</th>
                  <th className="px-3 py-2 font-medium">Giá trị đang có</th>
                  <th className="px-3 py-2 font-medium">Giá trị OCR đọc được</th>
                </tr>
              </thead>
              <tbody>
                {OCR_FIELD_DEFS.map(([key, label, type]) => {
                  const oldVal = (profile?.[key] ?? "").toString();
                  const newVal = (fields[key] ?? "").toString();
                  const differs = newVal.trim() !== "" && newVal.trim() !== oldVal.trim();
                  return (
                    <tr key={key} className="border-t">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={Boolean(picked[key])}
                          disabled={!newVal.trim()}
                          onChange={(e) =>
                            setPicked((prev) => ({ ...prev, [key]: e.target.checked }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">{label}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {oldVal || <span className="italic">— trống —</span>}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type={type}
                          value={newVal}
                          onChange={(e) =>
                            setFields((prev) => ({ ...(prev ?? {}), [key]: e.target.value }))
                          }
                          className={`h-8 ${differs ? "border-primary" : ""}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              disabled={selectedCount === 0 || saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              <Wand2 className="h-4 w-4 mr-1" />
              {saveMut.isPending ? "Đang lưu..." : `Lưu vào hồ sơ (${selectedCount})`}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setFields(null);
                setRaw(null);
                setPicked({});
              }}
            >
              Bỏ qua
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
