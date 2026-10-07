import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCourse, upsertCourse, upsertModule, deleteModule,
  upsertLesson, deleteLesson, listOnlineInstructors,
} from "@/lib/courses/courses.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, Video, FileText, ClipboardCheck, PenTool, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/courses/$id")({
  component: CourseEditor,
});

function CourseEditor() {
  const { id } = Route.useParams();
  const fetchCourse = useServerFn(getCourse);
  const fetchInstructors = useServerFn(listOnlineInstructors);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-course", id], queryFn: () => fetchCourse({ data: { id } }) });
  const instr = useQuery({ queryKey: ["online-instructors"], queryFn: () => fetchInstructors() });

  if (q.isLoading) return <div className="text-muted-foreground">Đang tải...</div>;
  if (q.error) return <div className="text-destructive">{(q.error as Error).message}</div>;
  if (!q.data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/courses" className="text-sm text-muted-foreground flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Danh sách khoá học</Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold">{q.data.course.title}</h1>
        <p className="text-sm text-muted-foreground">/{q.data.course.slug}</p>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="curriculum">Chương trình học</TabsTrigger>
          <TabsTrigger value="pricing">Giá & Xuất bản</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <InfoForm
            course={q.data.course}
            instructors={instr.data?.items ?? []}
            onSaved={() => qc.invalidateQueries({ queryKey: ["admin-course", id] })}
          />
        </TabsContent>
        <TabsContent value="curriculum">
          <CurriculumBuilder
            courseId={id}
            modules={q.data.modules}
            lessons={q.data.lessons}
            onChange={() => qc.invalidateQueries({ queryKey: ["admin-course", id] })}
          />
        </TabsContent>
        <TabsContent value="pricing">
          <PricingForm
            course={q.data.course}
            onSaved={() => qc.invalidateQueries({ queryKey: ["admin-course", id] })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------- INFO -------------------- */
function InfoForm({ course, instructors, onSaved }: { course: any; instructors: any[]; onSaved: () => void }) {
  const save = useServerFn(upsertCourse);
  const [form, setForm] = useState({ ...course, tags: (course.tags || []).join(", "), requirements: (course.requirements || []).join("\n"), outcomes: (course.outcomes || []).join("\n"), target_audience: (course.target_audience || []).join("\n") });
  const mut = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: () => { toast.success("Đã lưu"); onSaved(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  function submit() {
    mut.mutate({
      ...course,
      ...form,
      tags: form.tags.split(",").map((s: string) => s.trim()).filter(Boolean),
      requirements: form.requirements.split("\n").map((s: string) => s.trim()).filter(Boolean),
      outcomes: form.outcomes.split("\n").map((s: string) => s.trim()).filter(Boolean),
      target_audience: form.target_audience.split("\n").map((s: string) => s.trim()).filter(Boolean),
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tên khoá học">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Slug (URL)">
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </Field>
        <Field label="Phụ đề">
          <Input value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        </Field>
        <Field label="Ảnh bìa (URL)">
          <Input value={form.cover_url || ""} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
        </Field>
        <Field label="Ngôn ngữ dạy">
          <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
        </Field>
        <Field label="Cấp độ">
          <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi cấp độ</SelectItem>
              <SelectItem value="beginner">Sơ cấp</SelectItem>
              <SelectItem value="elementary">Cơ bản</SelectItem>
              <SelectItem value="intermediate">Trung cấp</SelectItem>
              <SelectItem value="upper">Trung cao</SelectItem>
              <SelectItem value="advanced">Cao cấp</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Giảng viên">
          <Select value={form.instructor_id || ""} onValueChange={(v) => setForm({ ...form, instructor_id: v || null })}>
            <SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger>
            <SelectContent>
              {instructors.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Danh mục">
          <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Tiếng Hàn / Kỹ năng / ..." />
        </Field>
      </div>

      <Field label="Video giới thiệu (trailer)">
        <div className="grid gap-2 md:grid-cols-[160px_1fr]">
          <Select value={form.trailer_provider || ""} onValueChange={(v) => setForm({ ...form, trailer_provider: v || null })}>
            <SelectTrigger><SelectValue placeholder="Nguồn" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="vimeo">Vimeo</SelectItem>
              <SelectItem value="bunny">Bunny Stream</SelectItem>
            </SelectContent>
          </Select>
          <Input value={form.trailer_video_id || ""} onChange={(e) => setForm({ ...form, trailer_video_id: e.target.value })} placeholder="ID video (VD: dQw4w9WgXcQ)" />
        </div>
      </Field>

      <Field label="Mô tả khoá học"><Textarea rows={5} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      <Field label="Thẻ (phân cách bởi dấu phẩy)"><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Yêu cầu đầu vào (mỗi dòng 1 ý)"><Textarea rows={5} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></Field>
        <Field label="Kết quả đạt được (mỗi dòng 1 ý)"><Textarea rows={5} value={form.outcomes} onChange={(e) => setForm({ ...form, outcomes: e.target.value })} /></Field>
        <Field label="Đối tượng phù hợp (mỗi dòng 1 ý)"><Textarea rows={5} value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} /></Field>
      </div>

      <Button onClick={submit} disabled={mut.isPending}><Save className="h-4 w-4 mr-1" />{mut.isPending ? "Đang lưu..." : "Lưu thông tin"}</Button>
    </div>
  );
}

/* -------------------- PRICING -------------------- */
function PricingForm({ course, onSaved }: { course: any; onSaved: () => void }) {
  const save = useServerFn(upsertCourse);
  const [form, setForm] = useState(course);
  const mut = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: () => { toast.success("Đã lưu"); onSaved(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4 max-w-xl">
      <Field label="Giá gốc (VND)">
        <Input type="number" value={form.price_vnd} onChange={(e) => setForm({ ...form, price_vnd: Number(e.target.value) })} />
      </Field>
      <Field label="Giá khuyến mãi (VND, để trống nếu không giảm)">
        <Input type="number" value={form.sale_price_vnd || ""} onChange={(e) => setForm({ ...form, sale_price_vnd: e.target.value ? Number(e.target.value) : null })} />
      </Field>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div><Label>Khoá học miễn phí</Label><p className="text-xs text-muted-foreground">Cho phép đăng ký không cần thanh toán</p></div>
        <Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} />
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div><Label>Xuất bản khoá học</Label><p className="text-xs text-muted-foreground">Hiển thị trên trang bán khoá học công khai</p></div>
        <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
      </div>
      <Button onClick={() => mut.mutate({ ...course, ...form })} disabled={mut.isPending}><Save className="h-4 w-4 mr-1" />Lưu</Button>
    </div>
  );
}

/* -------------------- CURRICULUM -------------------- */
function CurriculumBuilder({ courseId, modules, lessons, onChange }: { courseId: string; modules: any[]; lessons: any[]; onChange: () => void }) {
  const saveModule = useServerFn(upsertModule);
  const delMod = useServerFn(deleteModule);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const addMod = useMutation({
    mutationFn: (d: any) => saveModule({ data: d }),
    onSuccess: () => { toast.success("Đã thêm chương"); setNewModuleTitle(""); onChange(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const removeMod = useMutation({
    mutationFn: (id: string) => delMod({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá chương"); onChange(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4 flex gap-2">
        <Input placeholder="Tên chương mới, VD: Chương 1 — Bảng chữ cái" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} />
        <Button disabled={!newModuleTitle.trim() || addMod.isPending}
          onClick={() => addMod.mutate({ course_id: courseId, title: newModuleTitle.trim(), order_index: modules.length })}>
          <Plus className="h-4 w-4 mr-1" />Thêm chương
        </Button>
      </div>

      {modules.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Chưa có chương nào. Thêm chương đầu tiên để bắt đầu.
        </div>
      )}

      {modules.map((m) => (
        <ModuleBlock
          key={m.id}
          module={m}
          courseId={courseId}
          lessons={lessons.filter((l) => l.module_id === m.id)}
          onChange={onChange}
          onDelete={() => { if (confirm("Xoá chương và toàn bộ bài học bên trong?")) removeMod.mutate(m.id); }}
        />
      ))}
    </div>
  );
}

function ModuleBlock({ module, courseId, lessons, onChange, onDelete }: any) {
  const [open, setOpen] = useState(true);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const saveLesson = useServerFn(upsertLesson);
  const delLesson = useServerFn(deleteLesson);

  const saveMut = useMutation({
    mutationFn: (d: any) => saveLesson({ data: d }),
    onSuccess: () => { toast.success("Đã lưu bài học"); setEditingLesson(null); onChange(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delLesson({ data: { id, course_id: courseId } }),
    onSuccess: () => { toast.success("Đã xoá"); onChange(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        <button onClick={() => setOpen(!open)} className="p-1">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1 font-semibold">{module.title}</div>
        <span className="text-xs text-muted-foreground">{lessons.length} bài</span>
        <Button size="sm" variant="outline" onClick={() =>
          setEditingLesson({ course_id: courseId, module_id: module.id, title: "", type: "video", video_provider: "youtube", video_id: "", duration_seconds: 0, is_preview: false, order_index: lessons.length })
        }><Plus className="h-3 w-3 mr-1" />Bài học</Button>
        <Button size="sm" variant="outline" onClick={onDelete}><Trash2 className="h-3 w-3 text-destructive" /></Button>
      </div>

      {open && (
        <div className="divide-y">
          {lessons.map((l: any) => (
            <div key={l.id} className="flex items-center gap-3 p-3 text-sm">
              <LessonIcon type={l.type} />
              <div className="flex-1">
                <div className="font-medium">{l.title}</div>
                <div className="text-xs text-muted-foreground">
                  {l.type} · {Math.round((l.duration_seconds || 0) / 60)} phút
                  {l.is_preview && <span className="ml-2 rounded bg-emerald-100 text-emerald-700 px-1.5">Học thử</span>}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditingLesson(l)}><PenTool className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Xoá bài học?")) delMut.mutate(l.id); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          ))}
          {lessons.length === 0 && <div className="p-4 text-sm text-muted-foreground">Chưa có bài học</div>}
        </div>
      )}

      {editingLesson && (
        <LessonForm
          initial={editingLesson}
          onSave={(d: any) => saveMut.mutate(d)}
          onCancel={() => setEditingLesson(null)}
          pending={saveMut.isPending}
        />
      )}
    </div>
  );
}

function LessonForm({ initial, onSave, onCancel, pending }: any) {
  const [f, setF] = useState(initial);
  useEffect(() => setF(initial), [initial]);
  return (
    <div className="border-t p-4 bg-muted/20 space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Tên bài học"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Loại">
          <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="text">Văn bản</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="assignment">Bài tập</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {f.type === "video" && (
        <div className="grid gap-3 md:grid-cols-[160px_1fr_140px]">
          <Field label="Nguồn video">
            <Select value={f.video_provider || "youtube"} onValueChange={(v) => setF({ ...f, video_provider: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="bunny">Bunny Stream</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="ID / URL video"><Input value={f.video_id || ""} onChange={(e) => setF({ ...f, video_id: e.target.value })} placeholder="dQw4w9WgXcQ" /></Field>
          <Field label="Thời lượng (giây)"><Input type="number" value={f.duration_seconds} onChange={(e) => setF({ ...f, duration_seconds: Number(e.target.value) })} /></Field>
        </div>
      )}

      {f.type === "text" && (
        <Field label="Nội dung (Markdown)"><Textarea rows={8} value={f.content_md || ""} onChange={(e) => setF({ ...f, content_md: e.target.value })} /></Field>
      )}

      <div className="flex items-center justify-between rounded-md border p-3 bg-card">
        <div><Label>Cho phép học thử</Label><p className="text-xs text-muted-foreground">Khách chưa mua vẫn xem được</p></div>
        <Switch checked={f.is_preview} onCheckedChange={(v) => setF({ ...f, is_preview: v })} />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onSave(f)} disabled={pending || !f.title.trim()}><Save className="h-4 w-4 mr-1" />Lưu</Button>
        <Button variant="outline" onClick={onCancel}>Huỷ</Button>
      </div>
    </div>
  );
}

function LessonIcon({ type }: { type: string }) {
  const Cls = "h-4 w-4 text-muted-foreground";
  if (type === "video") return <Video className={Cls} />;
  if (type === "quiz") return <ClipboardCheck className={Cls} />;
  if (type === "assignment") return <PenTool className={Cls} />;
  return <FileText className={Cls} />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
