import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listLessons } from "@/lib/training/lms.functions";
import { NotebookPen, PlayCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/hoc-vien/bai-hoc")({ component: Page });

function Page() {
  const fetch = useServerFn(listLessons);
  const q = useQuery({ queryKey: ["my-lessons"], queryFn: () => fetch({ data: {} }) });
  const lessons = (q.data?.items ?? []).filter((l: any) => l.status === "published");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><NotebookPen className="h-6 w-6"/> Bài học</h1>
        <p className="text-sm text-muted-foreground">Nội dung học tập theo chương trình</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {lessons.map((l: any) => (
          <div key={l.id} className="rounded-2xl border bg-card p-5">
            <div className="text-xs text-muted-foreground mb-1">{l.training_programs?.name ?? "Chương trình"} • Bài {l.order_index}</div>
            <h3 className="font-bold text-lg">{l.title}</h3>
            {l.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{l.description}</p>}
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              {l.duration_minutes && <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{l.duration_minutes} phút</span>}
              {l.video_url && <a href={l.video_url} target="_blank" rel="noopener" className="flex items-center gap-1 text-primary hover:underline"><PlayCircle className="h-4 w-4"/>Xem video</a>}
            </div>
            {l.content && (
              <details className="mt-3">
                <summary className="text-sm text-primary cursor-pointer">Xem nội dung</summary>
                <div className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">{l.content}</div>
              </details>
            )}
          </div>
        ))}
        {lessons.length === 0 && <div className="col-span-2 text-center text-muted-foreground py-12 border rounded-2xl">Chưa có bài học</div>}
      </div>
    </div>
  );
}
