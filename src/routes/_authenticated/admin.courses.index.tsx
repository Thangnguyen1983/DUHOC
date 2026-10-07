import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCourses, upsertCourse, deleteCourse, toggleCoursePublish } from "@/lib/courses/courses.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, GraduationCap, Eye, EyeOff, Users, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/courses/")({
  component: CoursesPage,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-").slice(0, 100);
}

function CoursesPage() {
  const fetchList = useServerFn(listCourses);
  const save = useServerFn(upsertCourse);
  const remove = useServerFn(deleteCourse);
  const togglePub = useServerFn(toggleCoursePublish);
  const qc = useQueryClient();

  const list = useQuery({ queryKey: ["admin-courses"], queryFn: () => fetchList() });
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const saveMut = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: (row) => {
      toast.success("Đã tạo khoá học");
      setCreating(false); setNewTitle("");
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      window.location.href = `/admin/courses/${row.id}`;
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const pubMut = useMutation({
    mutationFn: (d: { id: string; is_published: boolean }) => togglePub({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="h-6 w-6" /> Khoá học trực tuyến</h1>
          <p className="text-sm text-muted-foreground">Quản lý E-learning: xây khoá học, bài giảng, giá bán</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" /> Khoá học mới</Button>
      </div>

      {creating && (
        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <label className="text-sm font-medium">Tên khoá học</label>
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="VD: Tiếng Hàn sơ cấp Topik 1-2" />
          <div className="flex gap-2">
            <Button
              disabled={!newTitle.trim() || saveMut.isPending}
              onClick={() => saveMut.mutate({
                title: newTitle.trim(),
                slug: slugify(newTitle) + "-" + Math.random().toString(36).slice(2, 6),
                language: "vi", level: "all", tags: [], requirements: [], outcomes: [], target_audience: [],
                price_vnd: 0, is_free: false, is_published: false, seo: {}, meta: {},
              })}
            >
              {saveMut.isPending ? "Đang tạo..." : "Tạo & mở"}
            </Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Huỷ</Button>
          </div>
        </div>
      )}

      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.data?.items.map((c: any) => (
          <div key={c.id} className="rounded-2xl border bg-card overflow-hidden flex flex-col h-full">
            <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
              {c.cover_url ? (
                <img src={c.cover_url} alt={c.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                  <GraduationCap className="h-8 w-8 opacity-40" />
                </div>
              )}
              <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium ${c.is_published ? "bg-emerald-500 text-white" : "bg-muted-foreground/70 text-white"}`}>
                {c.is_published ? "Đã xuất bản" : "Nháp"}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-2">
              <div className="font-semibold line-clamp-2 min-h-[2.75rem]">{c.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{c.subtitle ?? ""}</div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.total_lessons} bài · {c.total_minutes}p</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.students_count}</span>
              </div>
              <div className="text-sm">
                {c.is_free ? <span className="text-emerald-600 font-semibold">Miễn phí</span> :
                  c.sale_price_vnd ? (
                    <><span className="font-bold text-primary">{c.sale_price_vnd.toLocaleString("vi-VN")}₫</span>
                      <span className="ml-2 text-xs line-through text-muted-foreground">{c.price_vnd.toLocaleString("vi-VN")}₫</span></>
                  ) : <span className="font-bold">{c.price_vnd.toLocaleString("vi-VN")}₫</span>}
              </div>
              <div className="mt-auto flex gap-2 pt-2">
                <Link to="/admin/courses/$id" params={{ id: c.id }} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full"><Pencil className="h-3 w-3 mr-1" />Sửa</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => pubMut.mutate({ id: c.id, is_published: !c.is_published })}>
                  {c.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { if (confirm("Xoá khoá học?")) delMut.mutate(c.id); }}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {list.data && list.data.items.length === 0 && !creating && (
          <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            Chưa có khoá học nào. Bấm "Khoá học mới" để bắt đầu.
          </div>
        )}
      </div>
    </div>
  );
}
