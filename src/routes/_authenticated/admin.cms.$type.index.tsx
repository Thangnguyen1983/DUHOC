import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import {
  listEntries,
  publishEntry,
  softDeleteEntry,
  restoreEntry,
  hardDeleteEntry,
  duplicateEntry,
} from "@/lib/cms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Copy, RotateCcw, Send, Archive } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({
  module: z.string().optional(),
  market: z.string().optional(),
  category: z.string().optional(),
}).partial();

export const Route = createFileRoute("/_authenticated/admin/cms/$type/")({
  validateSearch: (s) => searchSchema.parse(s),
  component: EntryList,
});

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  scheduled: "Hẹn giờ",
  published: "Đã đăng",
  archived: "Đã ẩn",
};

const MODULES = [
  { value: "", label: "Tất cả module" },
  { value: "xkld", label: "XKLĐ" },
  { value: "du-hoc", label: "Du học" },
  { value: "ngoai-ngu", label: "Ngoại ngữ" },
  { value: "outsourcing", label: "Outsourcing" },
  { value: "visa", label: "Visa" },
];

const MARKETS: Record<string, { value: string; label: string }[]> = {
  "xkld": [
    { value: "", label: "Tất cả thị trường" },
    { value: "duc", label: "Đức" },
    { value: "dai-loan", label: "Đài Loan" },
    { value: "nhat-ban", label: "Nhật Bản" },
    { value: "han-quoc", label: "Hàn Quốc" },
    { value: "hungary", label: "Hungary" },
    { value: "romania", label: "Romania" },
    { value: "ba-lan", label: "Ba Lan" },
    { value: "czech", label: "Czech" },
    { value: "slovakia", label: "Slovakia" },
  ],
  "du-hoc": [
    { value: "", label: "Tất cả thị trường" },
    { value: "duc", label: "Đức" },
    { value: "han-quoc", label: "Hàn Quốc" },
    { value: "nhat-ban", label: "Nhật Bản" },
    { value: "dai-loan", label: "Đài Loan" },
    { value: "canada", label: "Canada" },
    { value: "chau-au", label: "Châu Âu" },
  ],
  "ngoai-ngu": [
    { value: "", label: "Tất cả ngôn ngữ" },
    { value: "duc", label: "Tiếng Đức" },
    { value: "han-quoc", label: "Tiếng Hàn" },
    { value: "nhat-ban", label: "Tiếng Nhật" },
    { value: "anh", label: "Tiếng Anh" },
  ],
};

const CATEGORIES = [
  { value: "", label: "Mọi danh mục" },
  { value: "tin-tuc", label: "Tin tức" },
  { value: "kinh-nghiem", label: "Kinh nghiệm" },
  { value: "huong-dan", label: "Hướng dẫn" },
  { value: "hoi-dap", label: "Hỏi đáp" },
  { value: "chi-phi", label: "Chi phí" },
  { value: "nganh-nghe", label: "Ngành nghề" },
];

function EntryList() {
  const { type } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [status, setStatus] = useState<"all" | "draft" | "pending" | "scheduled" | "published" | "archived" | "trash">("all");
  const [q, setQ] = useState("");
  const [module, setModule] = useState<string>(search.module ?? "");
  const [market, setMarket] = useState<string>(search.market ?? "");
  const [categorySlug, setCategorySlug] = useState<string>(search.category ?? "");

  const isPostType = type === "post";
  const marketOptions = module && MARKETS[module] ? MARKETS[module] : [{ value: "", label: "Chọn module trước" }];

  const fetchList = useServerFn(listEntries);
  const { data, isLoading } = useQuery({
    queryKey: ["cms-entries", type, status, q, module, market, categorySlug],
    queryFn: () => fetchList({ data: {
      type, status, q, limit: 200,
      ...(isPostType && module ? { module } : {}),
      ...(isPostType && market ? { market } : {}),
      ...(isPostType && categorySlug ? { categorySlug } : {}),
    } }),
  });

  const publish = useServerFn(publishEntry);
  const softDel = useServerFn(softDeleteEntry);
  const restore = useServerFn(restoreEntry);
  const hardDel = useServerFn(hardDeleteEntry);
  const dup = useServerFn(duplicateEntry);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cms-entries", type] });

  const mPublish = useMutation({ mutationFn: (id: string) => publish({ data: { id } }), onSuccess: () => { toast.success("Đã đăng"); invalidate(); }, onError: (e) => toast.error(errorMessage(e, "Lỗi")) });
  const mSoft = useMutation({ mutationFn: (id: string) => softDel({ data: { id } }), onSuccess: () => { toast.success("Đã chuyển thùng rác"); invalidate(); }, onError: (e) => toast.error(errorMessage(e, "Lỗi")) });
  const mRestore = useMutation({ mutationFn: (id: string) => restore({ data: { id } }), onSuccess: () => { toast.success("Đã khôi phục"); invalidate(); }, onError: (e) => toast.error(errorMessage(e, "Lỗi")) });
  const mHard = useMutation({ mutationFn: (id: string) => hardDel({ data: { id } }), onSuccess: () => { toast.success("Đã xóa vĩnh viễn"); invalidate(); }, onError: (e) => toast.error(errorMessage(e, "Lỗi")) });
  const mDup = useMutation({
    mutationFn: (id: string) => dup({ data: { id } }),
    onSuccess: (r) => { toast.success("Đã nhân bản"); invalidate(); navigate({ to: "/admin/cms/$type/$id", params: { type, id: r.id } }); },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground"><Link to="/admin/cms" className="hover:text-primary">← CMS</Link></div>
          <h1 className="text-2xl font-bold">{data?.type?.name ?? type}</h1>
        </div>
        <div className="flex gap-2">
          {isPostType && (
            <Button asChild variant="outline">
              <Link to="/admin/posts-hub">Ma trận thị trường</Link>
            </Button>
          )}
          <Button asChild className="bg-primary">
            <Link to="/admin/cms/$type/new" params={{ type }}><Plus className="mr-1 h-4 w-4" /> Tạo mới</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Tìm tiêu đề..." value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
        {isPostType && (
          <>
            <select
              value={module}
              onChange={(e) => { setModule(e.target.value); setMarket(""); }}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              {MODULES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
              disabled={!module}
            >
              {marketOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </>
        )}
        <div className="flex flex-wrap gap-1">
          {(["all","draft","pending","scheduled","published","archived","trash"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs ${status===s?"bg-primary text-primary-foreground":"bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {s === "all" ? "Tất cả" : s === "trash" ? "Thùng rác" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>


      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Phiên bản</th>
              <th className="px-4 py-3">Cập nhật</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Đang tải...</td></tr>
            )}
            {(data?.items ?? []).map((e: any) => (
              <tr key={e.id} className={e.deleted_at ? "opacity-60" : ""}>
                <td className="px-4 py-3">
                  <Link to="/admin/cms/$type/$id" params={{ type, id: e.id }} className="font-medium hover:text-primary">
                    {e.title}
                  </Link>
                  {e.excerpt && <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{e.excerpt}</div>}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{e.slug}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    e.status === "published" ? "bg-secondary/15 text-secondary" :
                    e.status === "pending" ? "bg-orange-100 text-orange-700" :
                    e.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                    "bg-muted text-muted-foreground"
                  }`}>{STATUS_LABEL[e.status] ?? e.status}</span>
                  {e.scheduled_at && <div className="mt-0.5 text-[10px] text-muted-foreground">{new Date(e.scheduled_at).toLocaleString("vi-VN")}</div>}
                </td>
                <td className="px-4 py-3 text-xs">v{e.version}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.updated_at).toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {status !== "trash" && e.status !== "published" && (
                      <Button size="sm" variant="ghost" title="Đăng ngay" onClick={() => mPublish.mutate(e.id)}>
                        <Send className="h-3 w-3" />
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline" title="Sửa">
                      <Link to="/admin/cms/$type/$id" params={{ type, id: e.id }}><Pencil className="h-3 w-3" /></Link>
                    </Button>
                    <Button size="sm" variant="ghost" title="Nhân bản" onClick={() => mDup.mutate(e.id)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    {status === "trash" ? (
                      <>
                        <Button size="sm" variant="ghost" title="Khôi phục" onClick={() => mRestore.mutate(e.id)}>
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" title="Xóa vĩnh viễn" onClick={() => {
                          if (confirm(`Xóa vĩnh viễn "${e.title}"? Không thể khôi phục.`)) mHard.mutate(e.id);
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-destructive" title="Xóa mềm" onClick={() => mSoft.mutate(e.id)}>
                        <Archive className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && (data?.items ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Chưa có bản ghi nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
