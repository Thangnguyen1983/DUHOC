import { errorMessage } from "@/lib/errors";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getLessonResources,
  saveLessonResources,
  suggestLessonResources,
  type FreeResource,
} from "@/lib/training/resources.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link2, Sparkles, Trash2 } from "lucide-react";

export function FreeResourcesPanel({
  lessonId,
  scope = "lesson",
  lessonTitle,
}: {
  lessonId: string;
  scope?: "lesson" | "course_lesson";
  lessonTitle?: string;
}) {
  const fetchRes = useServerFn(getLessonResources);
  const save = useServerFn(saveLessonResources);
  const suggest = useServerFn(suggestLessonResources);

  const q = useQuery({
    queryKey: ["lesson-resources", scope, lessonId],
    queryFn: () => fetchRes({ data: { scope, lesson_id: lessonId } }),
  });

  const [items, setItems] = useState<FreeResource[]>([]);
  useEffect(() => {
    if (q.data) setItems(q.data.resources ?? []);
  }, [q.data]);

  const suggestMut = useMutation({
    mutationFn: () => suggest({ data: { title: lessonTitle || q.data?.title || "" } }),
    onSuccess: (r: any) => {
      if (!r.resources?.length) return toast.error("AI chưa gợi ý được, thử lại sau");
      setItems((prev) => [...prev, ...r.resources]);
      toast.success(`AI gợi ý ${r.resources.length} nguồn — hãy kiểm tra rồi lưu`);
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const saveMut = useMutation({
    mutationFn: () => save({ data: { scope, lesson_id: lessonId, resources: items } }),
    onSuccess: () => toast.success("Đã lưu nguồn học liệu"),
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const update = (i: number, patch: Partial<FreeResource>) =>
    setItems((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Link2 className="h-4 w-4" /> Nguồn học liệu miễn phí
          <span className="text-xs font-normal text-muted-foreground">(bắt buộc tối thiểu 1 liên kết)</span>
        </h3>
        <Button size="sm" variant="secondary" onClick={() => suggestMut.mutate()} disabled={suggestMut.isPending}>
          <Sparkles className="mr-2 h-4 w-4" /> AI gợi ý
        </Button>
      </div>

      {items.map((r, i) => (
        <div key={i} className="grid gap-2 md:grid-cols-[1fr_1.4fr_1fr_auto]">
          <Input placeholder="Tiêu đề" value={r.title} onChange={(e) => update(i, { title: e.target.value })} />
          <Input placeholder="https://…" value={r.url} onChange={(e) => update(i, { url: e.target.value })} />
          <Input placeholder="Ghi chú" value={r.note ?? ""} onChange={(e) => update(i, { note: e.target.value })} />
          <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {!items.length && <p className="text-sm text-muted-foreground">Chưa có nguồn học liệu nào.</p>}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setItems([...items, { title: "", url: "", note: "" }])}>
          Thêm dòng
        </Button>
        <Button size="sm" onClick={() => saveMut.mutate()} disabled={!items.length || saveMut.isPending}>
          Lưu học liệu
        </Button>
      </div>
    </div>
  );
}
