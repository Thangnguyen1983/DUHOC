import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { getPresentationDeck, logPresentation, MATERIAL_TYPES } from "@/lib/training/curriculum.functions";
import { Button } from "@/components/ui/button";
import { Play, ArrowLeft, Presentation, FileText, Music, Video, Image as ImageIcon, File } from "lucide-react";
import { StatusBadge, MARKET_LABEL } from "@/components/training/materials-manager";
import { errorMessage } from "@/lib/errors";

// Trình chiếu dùng pdfjs (chỉ trình duyệt) → tải lười.
const PresentationPlayer = lazy(() => import("@/components/training/presentation-player").then((m) => ({ default: m.PresentationPlayer })));

export const Route = createFileRoute("/giang-day/trinh-chieu/$classId")({
  validateSearch: z.object({ session: z.string().uuid().optional() }),
  component: ClassPresentation,
});

const ICON: Record<string, any> = { slide: Presentation, pdf: FileText, audio: Music, video: Video, image: ImageIcon, document: File };

function ClassPresentation() {
  const { classId } = Route.useParams();
  const { session } = Route.useSearch();
  const navigate = Route.useNavigate();
  const fetchDeck = useServerFn(getPresentationDeck);
  const log = useServerFn(logPresentation);
  const q = useQuery({
    queryKey: ["presentation-deck", classId, session ?? null],
    queryFn: () => fetchDeck({ data: { class_id: classId, session_id: session } }),
    staleTime: 30 * 60 * 1000,
  });
  const [playing, setPlaying] = useState<number | null>(null);
  const logId = useRef<string | null>(null);

  // Ghi nhật ký trình chiếu: bắt đầu khi mở, kết thúc khi đóng/rời trang.
  useEffect(() => {
    if (playing === null) return;
    const item = q.data?.items[playing];
    log({ data: { class_id: classId, session_id: session ?? null, material_id: item?.id ?? null } }).then((r) => { logId.current = r.id; }).catch(() => {});
    const end = () => { if (logId.current) { log({ data: { id: logId.current, class_id: classId, ended: true } }).catch(() => {}); logId.current = null; } };
    window.addEventListener("beforeunload", end);
    return () => { end(); window.removeEventListener("beforeunload", end); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing !== null]);

  if (q.isLoading) return <div className="text-muted-foreground">Đang chuẩn bị bộ tài liệu...</div>;
  if (q.error) return <div className="rounded-2xl border bg-card p-6 text-destructive">{errorMessage(q.error)}</div>;
  const data = q.data!;
  const items = data.items;
  const forSession = items.filter((i: any) => i.forSession);
  const others = items.filter((i: any) => !i.forSession);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/giang-day/trinh-chieu" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/> Chọn lớp khác</Link>
          <h1 className="text-2xl font-bold">{data.class.name}</h1>
          <p className="text-sm text-muted-foreground">{(data.class as any).training_programs?.name} {data.market ? `· ${MARKET_LABEL[data.market] ?? data.market}` : ""} · {items.length} tài liệu sẵn sàng chiếu</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={session ?? ""} onChange={(e) => navigate({ search: e.target.value ? { session: e.target.value } : {} })}>
            <option value="">Tất cả buổi học</option>
            {data.sessions.map((s: any) => <option key={s.id} value={s.id}>Buổi {s.session_no}{s.topic || s.title ? ` · ${s.topic ?? s.title}` : ""}{s.session_date ? ` (${s.session_date})` : ""}</option>)}
          </select>
          <Button onClick={() => setPlaying(0)} disabled={items.length === 0}><Play className="h-4 w-4 mr-1"/> Bắt đầu trình chiếu</Button>
        </div>
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          Chưa có tài liệu đã duyệt cho lớp này. <Link to="/giang-day/tai-lieu" className="text-primary underline">Thêm tài liệu</Link> và gửi duyệt trước khi giảng dạy.
        </div>
      )}

      {session && forSession.length > 0 && <DeckGroup title={`Tài liệu buổi ${data.session?.session_no}`} items={forSession} allItems={items} onPlay={setPlaying} highlight />}
      {others.length > 0 && <DeckGroup title={session ? "Tài liệu khác của lớp" : "Bộ tài liệu của lớp"} items={others} allItems={items} onPlay={setPlaying} />}

      {playing !== null && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] grid place-items-center bg-neutral-950 text-white">Đang mở trình chiếu...</div>}>
          <PresentationPlayer items={items as any} startIndex={playing} onClose={() => setPlaying(null)} heading={data.class.name} />
        </Suspense>
      )}
    </div>
  );
}

function DeckGroup({ title, items, allItems, onPlay, highlight }: { title: string; items: any[]; allItems: any[]; onPlay: (i: number) => void; highlight?: boolean }) {
  return (
    <section className={`rounded-2xl border bg-card ${highlight ? "border-primary/40 ring-1 ring-primary/20" : ""}`}>
      <div className="border-b px-4 py-3 font-bold">{title}</div>
      <ul className="divide-y">
        {items.map((m) => {
          const Icon = ICON[m.material_type] ?? File;
          const idx = allItems.findIndex((x) => x.id === m.id);
          return (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5"/></div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{m.title}</div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {m.lesson_no && <span>Buổi {m.lesson_no}</span>}
                  <span>{MATERIAL_TYPES.find((t) => t.value === m.material_type)?.label}</span>
                  <span className="truncate">{m.file_name}</span>
                  {m.pdf_url && <span className="rounded bg-muted px-1">PDF kèm</span>}
                  {m.approval_status !== "approved" && <StatusBadge status={m.approval_status}/>}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => onPlay(idx)}><Play className="h-4 w-4 mr-1"/> Chiếu</Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
