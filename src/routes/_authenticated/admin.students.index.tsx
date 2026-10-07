import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  listStudents,
  createStudent,
  exportStudentsCsv,
  ocrIdentityDoc,
  checkStudentDuplicates,
  type DuplicateMatch,
} from "@/lib/students.functions";
import { lookupCollaborator } from "@/lib/commissions/commissions.functions";
import { DeleteStudentDialog } from "@/components/students/delete-student-dialog";
import { DuplicateWarningDialog } from "@/components/students/duplicate-warning-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CONTRACT_CLASS,
  contractLevel,
  contractText,
  fmtDate,
} from "@/lib/students/placement";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Download, ScanLine, Loader2, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  AddressFields,
  EMPTY_ADDRESS_SET,
  addressSetToFields,
  type AddressSet,
} from "@/components/students/address-panel";

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

export const Route = createFileRoute("/_authenticated/admin/students/")({
  head: () => ({ meta: [
    { title: "Hồ sơ học viên — Quản trị KAIZEN" },
    { name: "description", content: "Quản lý hồ sơ học viên và tiến trình tại KAIZEN." },
    { property: "og:title", content: "Hồ sơ học viên — Quản trị KAIZEN" },
    { property: "og:description", content: "Quản lý hồ sơ học viên và tiến trình tại KAIZEN." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: StudentsListPage,
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

const MARKET_LABEL: Record<string, string> = {
  germany: "🇩🇪 Đức",
  taiwan: "🇹🇼 Đài Loan",
  japan: "🇯🇵 Nhật",
  china: "🇨🇳 Trung",
  korea: "🇰🇷 Hàn",
};

function statusColor(s: string) {
  if (s === "completed") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "cancelled") return "bg-red-100 text-red-700 border-red-200";
  if (s === "paused") return "bg-amber-100 text-amber-700 border-amber-200";
  if (["departed", "post_departure"].includes(s)) return "bg-blue-100 text-blue-700 border-blue-200";
  if (["visa_processing", "visa_granted", "departure_pending"].includes(s))
    return "bg-purple-100 text-purple-700 border-purple-200";
  if (["training", "exam_pending", "training_passed"].includes(s))
    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function StudentsListPage() {
  const fetchStudents = useServerFn(listStudents);
  const createFn = useServerFn(createStudent);
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [market, setMarket] = useState<string>("all");
  const [contract, setContract] = useState<string>("all");
  const [programType, setProgramType] = useState<"all" | "du_hoc" | "xkld">("all");
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-students", { search, status, market, contract, programType }],
    queryFn: () =>
      fetchStudents({
        data: {
          search: search || undefined,
          status: status === "all" ? undefined : status,
          market: market === "all" ? undefined : market,
          contract: contract === "all" ? undefined : (contract as any),
          program_type: programType === "all" ? undefined : programType,
          limit: 200,
        },
      }),
  });

  const [dup, setDup] = useState<{ payload: any; matches: DuplicateMatch[] } | null>(null);

  const createMut = useMutation({
    mutationFn: (payload: any) => createFn({ data: payload }),
    onSuccess: (res: any, payload: any) => {
      if (res?.duplicate) {
        setDup({ payload, matches: res.matches ?? [] });
        return;
      }
      toast.success(payload?.force ? "Đã tạo hồ sơ mới (bỏ qua cảnh báo trùng)" : "Đã tạo hồ sơ");
      setDup(null);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  const items = data?.items ?? [];

  return (
     <div className="min-w-0 space-y-6 p-0 sm:p-6">
      <DuplicateWarningDialog
        open={!!dup}
        matches={dup?.matches ?? []}
        onCancel={() => setDup(null)}
        onProceed={() => dup && createMut.mutate({ ...dup.payload, force: true })}
        proceeding={createMut.isPending}
      />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Hồ sơ học viên</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý 360° hồ sơ — thông tin, workflow, chăm sóc, tài liệu và lớp học.
          </p>
        </div>
         <div className="flex flex-wrap items-center gap-2">
          <ExportButton search={search} status={status} market={market} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Tạo hồ sơ
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo hồ sơ học viên</DialogTitle>
            </DialogHeader>
            <CreateStudentForm
              onSubmit={(payload) => createMut.mutate(payload)}
              submitting={createMut.isPending}
            />
            </DialogContent>
          </Dialog>
        </div>
      </div>

       <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
         <div className="relative min-w-0 flex-1 sm:min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã học viên (KZ...), tên, SĐT, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div role="tablist" aria-label="Loại hồ sơ" className="flex w-full rounded-md border p-1 sm:w-auto">
          {([["all", "Tất cả"], ["du_hoc", "Du học"], ["xkld", "Xuất khẩu lao động"]] as const).map(([k, v]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={programType === k}
              onClick={() => setProgramType(k)}
              className={`min-h-9 flex-1 whitespace-nowrap rounded px-3 text-sm sm:flex-none ${programType === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {v}
            </button>
          ))}
        </div>
        <Select value={status} onValueChange={setStatus}>
           <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={market} onValueChange={setMarket}>
           <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Thị trường" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả thị trường</SelectItem>
            {Object.entries(MARKET_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={contract} onValueChange={setContract}>
           <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Hạn hợp đồng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hợp đồng</SelectItem>
            <SelectItem value="d7">Sắp hết hạn ≤ 7 ngày</SelectItem>
            <SelectItem value="d30">Sắp hết hạn ≤ 30 ngày</SelectItem>
            <SelectItem value="d90">Sắp hết hạn ≤ 90 ngày</SelectItem>
            <SelectItem value="overdue">Đã quá hạn</SelectItem>
          </SelectContent>
        </Select>
      </div>

       <div className="max-w-full overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Mã HV</th>
              <th className="px-4 py-3 font-medium">Họ tên</th>
              <th className="px-4 py-3 font-medium">Liên hệ</th>
              <th className="px-4 py-3 font-medium">Thị trường</th>
              <th className="px-4 py-3 font-medium">Chương trình</th>
              <th className="px-4 py-3 font-medium">Nơi làm việc</th>
              <th className="px-4 py-3 font-medium">Hạn hợp đồng</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-2 py-3 font-medium" aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  Chưa có hồ sơ phù hợp
                </td>
              </tr>
            )}
            {items.map((s: any) => (
              <tr key={s.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  {s.student_code ? (
                    <span className="font-mono text-xs font-semibold text-primary">
                      {s.student_code}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">
                  <Link
                    to="/admin/students/$id"
                    params={{ id: s.id }}
                    className="hover:underline text-primary"
                  >
                    {s.full_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div>{s.phone}</div>
                  <div className="text-xs">{s.email}</div>
                </td>
                <td className="px-4 py-3">{MARKET_LABEL[s.country] ?? s.country ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`mr-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${s.program_type === "du_hoc" ? "bg-secondary text-secondary-foreground" : "bg-accent text-accent-foreground"}`}>
                    {s.program_type === "du_hoc" ? "Du học" : "XKLĐ"}
                  </span>
                  {s.program ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div>{s.employer_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {[s.occupation, s.destination_country].filter(Boolean).join(" · ")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {s.contract_end_date ? (
                    <Badge
                      variant="secondary"
                      className={CONTRACT_CLASS[contractLevel(s.contract_end_date)]}
                    >
                      {fmtDate(s.contract_end_date)} · {contractText(s.contract_end_date)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={statusColor(s.current_status)}>
                    {STATUS_LABEL[s.current_status] ?? s.current_status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(s.created_at).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-2 py-3 text-right">
                  <DeleteStudentDialog
                    studentId={s.id}
                    studentCode={s.student_code}
                    fullName={s.full_name}
                    iconOnly
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExportButton({ search, status, market }: { search: string; status: string; market: string }) {
  const exportFn = useServerFn(exportStudentsCsv);
  const mut = useMutation({
    mutationFn: () =>
      exportFn({
        data: {
          search: search || undefined,
          status: status === "all" ? undefined : status,
          market: market === "all" ? undefined : market,
          limit: 5000,
        },
      }),
    onSuccess: (r) => {
      const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ho-so-hoc-vien-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${r.count} hồ sơ`);
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi xuất file")),
  });
  return (
    <Button variant="outline" onClick={() => mut.mutate()} disabled={mut.isPending}>
      <Download className="h-4 w-4 mr-1" />
      {mut.isPending ? "Đang xuất..." : "Xuất Excel"}
    </Button>
  );
}

type CreatePayload = {
  full_name: string;
  phone: string;
  email: string;
  dob: string;
  country: string;
  program: string;
  program_type: string;
  current_status: string;
  [geoField: string]: string;
};

function CreateStudentForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (p: CreatePayload) => void;
  submitting: boolean;
}) {
  const ocrFn = useServerFn(ocrIdentityDoc);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [ocrInfo, setOcrInfo] = useState<Record<string, string> | null>(null);
  const dupCheckFn = useServerFn(checkStudentDuplicates);
  const [liveDup, setLiveDup] = useState<DuplicateMatch[]>([]);
  const dupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Kiểm tra trùng "sống" (debounce 500ms) khi gõ SĐT / email / họ tên + ngày sinh. */
  const scheduleDupCheck = (next: { phone: string; email: string; full_name: string; dob: string }) => {
    if (dupTimer.current) clearTimeout(dupTimer.current);
    const p = next.phone.replace(/\D/g, "");
    if (p.length < 8 && !next.email.includes("@") && !(next.full_name && next.dob)) {
      setLiveDup([]);
      return;
    }
    dupTimer.current = setTimeout(() => {
      dupCheckFn({ data: next })
        .then((r) => setLiveDup(r.matches ?? []))
        .catch(() => setLiveDup([]));
    }, 500);
  };
  const [form, setForm] = useState<CreatePayload>({
    full_name: "",
    phone: "",
    email: "",
    dob: "",
    country: "",
    program: "",
    program_type: "",
    current_status: "lead_new",
  });

  const onPickFile = async (file: File) => {
    if (!file) return;
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
          doc_type: "passport",
        },
      });
      const f = res.fields ?? {};
      setOcrInfo(f);
      setForm((prev) => ({
        ...prev,
        full_name: f.full_name || prev.full_name,
        dob: f.dob || prev.dob,
      }));
      toast.success("Đã đọc xong giấy tờ, đã điền hồ sơ");
    } catch (e: any) {
      toast.error(errorMessage(e, "OCR thất bại"));
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const [addr, setAddr] = useState<AddressSet>(EMPTY_ADDRESS_SET);
  const [addrOpen, setAddrOpen] = useState(false);
  const addrFilled = (["origin", "residence", "current"] as const).filter(
    (k) => addr[k].province_code || addr[k].detail,
  ).length;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const { collab_code, collab_revenue, collab_amount, ...rest } = form;
        const toNum = (v?: string) => Number((v ?? "").replace(/\D/g, "")) || 0;
        onSubmit({
          ...rest,
          ...addressSetToFields(addr),
          ...(collab_code?.trim()
            ? { collaborator_code: collab_code.trim().toUpperCase(), order_revenue: toNum(collab_revenue), commission_amount: toNum(collab_amount) }
            : {}),
        } as any);
      }}
    >
      <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-3">
        <ScanLine className="h-5 w-5 text-primary" />
        <div className="flex-1 text-sm">
          <div className="font-medium">Quét OCR Hộ chiếu / CCCD / CMND</div>
          <div className="text-xs text-muted-foreground">
            Tự động đọc ảnh và điền họ tên, ngày sinh, số giấy tờ.
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPickFile(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={scanning}
          onClick={() => fileRef.current?.click()}
        >
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang đọc...
            </>
          ) : (
            <>
              <ScanLine className="h-4 w-4 mr-1" /> Tải ảnh
            </>
          )}
        </Button>
      </div>

      {ocrInfo && (
        <div className="rounded-md border bg-card p-3 text-xs space-y-1">
          <div className="font-medium text-sm mb-1">Thông tin đọc được:</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              ["Họ tên", ocrInfo.full_name],
              ["Ngày sinh", ocrInfo.dob],
              ["Giới tính", ocrInfo.gender],
              ["Loại GT", ocrInfo.document_type],
              ["Số GT", ocrInfo.document_no],
              ["Quốc tịch", ocrInfo.nationality],
              ["Quê quán", ocrInfo.place_of_origin],
              ["Thường trú", ocrInfo.place_of_residence],
              ["Ngày cấp", ocrInfo.issue_date],
              ["Hết hạn", ocrInfo.expiry_date],
              ["Nơi cấp", ocrInfo.issue_place],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k as string}>
                  <span className="text-muted-foreground">{k}: </span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Họ và tên *</Label>
          <Input
            required
            value={form.full_name}
            onChange={(e) => { const n = { ...form, full_name: e.target.value }; setForm(n); scheduleDupCheck(n); }}
          />
        </div>
        <div>
          <Label>Số điện thoại *</Label>
          <Input
            required
            value={form.phone}
            onChange={(e) => { const n = { ...form, phone: e.target.value }; setForm(n); scheduleDupCheck(n); }}
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => { const n = { ...form, email: e.target.value }; setForm(n); scheduleDupCheck(n); }}
          />
        </div>
        <div>
          <Label>Ngày sinh</Label>
          <Input
            type="date"
            value={form.dob}
            onChange={(e) => { const n = { ...form, dob: e.target.value }; setForm(n); scheduleDupCheck(n); }}
          />
        </div>
        <div>
          <Label htmlFor="new-program-type">Loại hồ sơ <span className="text-destructive">*</span></Label>
          <select
            id="new-program-type"
            required
            aria-required="true"
            value={form.program_type}
            onChange={(e) => setForm({ ...form, program_type: e.target.value })}
            className="w-full h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">— Chọn loại hồ sơ —</option>
            <option value="du_hoc">Du học</option>
            <option value="xkld">Xuất khẩu lao động / Kỹ sư</option>
            <option value="thuc_tap_sinh">Thực tập sinh kỹ năng</option>
          </select>
        </div>
        <div>
          <Label>Thị trường</Label>
          <select
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="w-full h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">—</option>
            {Object.entries(MARKET_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Chương trình</Label>
          <Input
            placeholder="Điều dưỡng Đức..."
            value={form.program}
            onChange={(e) => setForm({ ...form, program: e.target.value })}
          />
        </div>
      </div>

      <CollaboratorFields
        code={form.collab_code ?? ""}
        revenue={form.collab_revenue ?? ""}
        amount={form.collab_amount ?? ""}
        onChange={(patch) => setForm({ ...form, ...patch })}
      />

      {/* Nơi ở & địa bàn — chọn từ danh mục địa giới hành chính (không bắt buộc) */}
      <div className="rounded-lg border bg-muted/20">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm"
          onClick={() => setAddrOpen((v) => !v)}
          aria-expanded={addrOpen}
        >
          <span className="flex items-center gap-2 font-medium">
            <MapPin className="h-4 w-4 text-primary" /> Nơi ở & địa bàn
            <span className="text-xs font-normal text-muted-foreground">
              (Quê quán · Thường trú · Nơi ở hiện tại — không bắt buộc)
            </span>
          </span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {addrFilled > 0 && <Badge variant="secondary">{addrFilled}/3 đã nhập</Badge>}
            {addrOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
        {addrOpen && (
          <div className="border-t p-3">
            <AddressFields value={addr} onChange={setAddr} compact />
          </div>
        )}
      </div>

      {liveDup.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="font-semibold">Có {liveDup.length} hồ sơ trùng thông tin</div>
          <ul className="mt-1 space-y-1">
            {liveDup.slice(0, 3).map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{m.full_name}</span>
                {m.student_code && <span className="font-mono text-xs">{m.student_code}</span>}
                <span className="text-xs text-amber-800">({m.reasons.join(", ")})</span>
                <Link to="/admin/students/$id" params={{ id: m.id }} className="text-xs underline">
                  Mở hồ sơ cũ
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-1 text-xs">Bấm "Tạo hồ sơ" sẽ hỏi xác nhận trước khi ghi tiếp.</div>
        </div>
      )}
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Đang tạo..." : "Tạo hồ sơ"}
        </Button>
      </DialogFooter>
    </form>
  );
}


/** Ô nhập mã CTV giới thiệu + doanh thu/hoa hồng; kiểm tra mã khi rời ô. */
function CollaboratorFields({ code, revenue, amount, onChange }: {
  code: string; revenue: string; amount: string;
  onChange: (p: { collab_code?: string; collab_revenue?: string; collab_amount?: string }) => void;
}) {
  const lookupFn = useServerFn(lookupCollaborator);
  const [check, setCheck] = useState<{ ok: boolean; text: string } | null>(null);
  const fmt = (v: string) => { const n = v.replace(/\D/g, ""); return n ? Number(n).toLocaleString("vi-VN") : ""; };
  const verify = async () => {
    const c = code.trim();
    if (!c) { setCheck(null); return; }
    if (c.length < 6) { setCheck({ ok: false, text: "Mã CTV có dạng KZ-CTV-YYMM-XXXX" }); return; }
    try {
      const r = await lookupFn({ data: { code: c } });
      setCheck(r.ok ? { ok: true, text: `Cộng tác viên: ${r.name}` } : { ok: false, text: r.error });
    } catch { setCheck({ ok: false, text: "Không kiểm tra được mã, vui lòng thử lại" }); }
  };
  return (
    <fieldset className="rounded-lg border bg-muted/20 p-3 space-y-2">
      <legend className="px-1 text-sm font-medium">Cộng tác viên giới thiệu (nếu có)</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="collab-code">Mã CTV</Label>
          <Input id="collab-code" placeholder="KZ-CTV-2608-0001" value={code}
            aria-invalid={check ? !check.ok : undefined} aria-describedby="collab-check"
            onChange={(e) => { onChange({ collab_code: e.target.value }); setCheck(null); }}
            onBlur={verify} />
        </div>
        <div>
          <Label htmlFor="collab-revenue">Doanh thu đơn hàng (VNĐ)</Label>
          <Input id="collab-revenue" inputMode="numeric" disabled={!code.trim()} value={fmt(revenue)}
            onChange={(e) => onChange({ collab_revenue: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="collab-amount">Hoa hồng CTV (VNĐ)</Label>
          <Input id="collab-amount" inputMode="numeric" disabled={!code.trim()} value={fmt(amount)}
            onChange={(e) => onChange({ collab_amount: e.target.value })} />
        </div>
      </div>
      <p id="collab-check" className={"text-xs " + (check ? (check.ok ? "text-primary" : "text-destructive") : "text-muted-foreground")}>
        {check ? check.text : "Nhập mã để ghi nhận doanh thu và hoa hồng. Khoản hoa hồng sẽ ở trạng thái Chờ duyệt."}
      </p>
    </fieldset>
  );
}
