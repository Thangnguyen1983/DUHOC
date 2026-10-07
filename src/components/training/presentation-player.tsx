/**
 * Trình chiếu lớp học — chạy hoàn toàn phía trình duyệt.
 * PDF: pdfjs-dist tải động (không SSR). Ảnh/audio/video: thẻ native.
 * PowerPoint: iframe Office Online viewer (cần signed URL công khai tạm thời), ưu tiên bản PDF kèm nếu có.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2, ZoomIn, ZoomOut, List, ExternalLink } from "lucide-react";

export type DeckItem = {
  id: string;
  title: string;
  material_type: string;
  file_name: string | null;
  file_type: string | null;
  url: string | null;
  pdf_url: string | null;
  lesson_no: number | null;
  approval_status: string;
};

type Mode = "pdf" | "image" | "audio" | "video" | "office" | "other";

function detectMode(item: DeckItem): { mode: Mode; src: string } {
  const name = (item.file_name ?? "").toLowerCase();
  const mime = (item.file_type ?? "").toLowerCase();
  if (item.pdf_url) return { mode: "pdf", src: item.pdf_url };
  const src = item.url ?? "";
  if (name.endsWith(".pdf") || mime === "application/pdf") return { mode: "pdf", src };
  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(name)) return { mode: "image", src };
  if (mime.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/.test(name)) return { mode: "audio", src };
  if (mime.startsWith("video/") || /\.(mp4|webm|mov)$/.test(name)) return { mode: "video", src };
  if (/\.(pptx?|docx?|xlsx?|odp)$/.test(name) || mime.includes("officedocument") || mime.includes("powerpoint")) return { mode: "office", src };
  return { mode: "other", src };
}

export function PresentationPlayer({ items, startIndex = 0, onClose, onItemChange, heading }: {
  items: DeckItem[];
  startIndex?: number;
  onClose: () => void;
  onItemChange?: (item: DeckItem) => void;
  heading?: string;
}) {
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(items.length - 1, 0)));
  const [showList, setShowList] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const item = items[index];
  const { mode, src } = item ? detectMode(item) : { mode: "other" as Mode, src: "" };

  // Phím tắt: ← → chuyển tài liệu (khi không phải PDF, PDF tự xử lý trang), Esc thoát, F toàn màn hình.
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, items.length - 1)), [items.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => { if (item && onItemChange) onItemChange(item); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (document.fullscreenElement) document.exitFullscreen(); else onClose(); }
      if (e.key.toLowerCase() === "f") toggleFullscreen();
      if (mode !== "pdf") {
        if (e.key === "ArrowRight" || e.key === "PageDown") next();
        if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, next, prev, onClose]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen?.();
  }

  if (!item) return null;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] flex flex-col bg-neutral-950 text-white" role="dialog" aria-label="Trình chiếu lớp học">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/60 px-3 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setShowList((s) => !s)} title="Danh sách tài liệu"><List className="h-4 w-4"/></Button>
          <div className="truncate">
            {heading && <span className="text-white/60">{heading} · </span>}
            <span className="font-semibold">{item.title}</span>
            {item.lesson_no && <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-xs">Buổi {item.lesson_no}</span>}
            {item.approval_status !== "approved" && <span className="ml-2 rounded bg-amber-500/30 px-1.5 py-0.5 text-xs text-amber-200">Bản nháp</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs text-white/60">{index + 1}/{items.length}</span>
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={prev} disabled={index === 0} title="Tài liệu trước"><ChevronLeft className="h-4 w-4"/></Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={next} disabled={index >= items.length - 1} title="Tài liệu sau"><ChevronRight className="h-4 w-4"/></Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={toggleFullscreen} title="Toàn màn hình (F)">{fullscreen ? <Minimize2 className="h-4 w-4"/> : <Maximize2 className="h-4 w-4"/>}</Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={onClose} title="Thoát (Esc)"><X className="h-4 w-4"/></Button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {showList && (
          <aside className="w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-black/50 p-2 text-sm">
            {items.map((it, i) => (
              <button key={it.id} onClick={() => { setIndex(i); setShowList(false); }} className={`block w-full rounded px-3 py-2 text-left hover:bg-white/10 ${i === index ? "bg-white/15 font-semibold" : ""}`}>
                <div className="truncate">{it.title}</div>
                <div className="text-xs text-white/50">{it.lesson_no ? `Buổi ${it.lesson_no} · ` : ""}{it.material_type}</div>
              </button>
            ))}
          </aside>
        )}
        <main className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden">
          {mode === "pdf" && <PdfViewer key={src} src={src} onEndNext={next} onStartPrev={prev} />}
          {mode === "image" && <img src={src} alt={item.title} className="max-h-full max-w-full object-contain" />}
          {mode === "video" && <video src={src} controls autoPlay className="max-h-full max-w-full" />}
          {mode === "audio" && (
            <div className="w-full max-w-xl space-y-6 p-8 text-center">
              <div className="text-2xl font-bold">{item.title}</div>
              <audio src={src} controls autoPlay className="w-full" />
              <p className="text-sm text-white/60">Dùng ← → để chuyển tài liệu</p>
            </div>
          )}
          {mode === "office" && (
            <iframe
              title={item.title}
              className="h-full w-full bg-white"
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(src)}`}
              allowFullScreen
            />
          )}
          {mode === "other" && (
            <div className="space-y-4 text-center">
              <p className="text-white/70">Định dạng này không hỗ trợ chiếu trực tiếp.</p>
              <Button asChild variant="secondary"><a href={src} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1"/> Mở trong tab mới</a></Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------------- PDF viewer (pdfjs-dist, chỉ client) ---------------- */
function PdfViewer({ src, onEndNext, onStartPrev }: { src: string; onEndNext: () => void; onStartPrev: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);
  const renderTask = useRef<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs: any = await import("pdfjs-dist");
        const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const doc = await pdfjs.getDocument({ url: src }).promise;
        if (cancelled) return;
        docRef.current = doc;
        setTotal(doc.numPages);
        setPage(1);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) { setError(e?.message ?? "Không tải được PDF"); setLoading(false); }
      }
    })();
    return () => { cancelled = true; docRef.current?.destroy?.(); docRef.current = null; };
  }, [src]);

  const renderSeq = useRef(0);
  const render = useCallback(async () => {
    const doc = docRef.current; const canvas = canvasRef.current; const box = containerRef.current;
    if (!doc || !canvas || !box) return;
    const seq = ++renderSeq.current;
    // Huỷ lượt vẽ trước và chờ nó kết thúc hẳn trước khi dùng lại canvas
    if (renderTask.current) {
      try { renderTask.current.cancel(); await renderTask.current.promise; } catch { /* cancelled */ }
      renderTask.current = null;
    }
    if (seq !== renderSeq.current) return;
    const pdfPage = await doc.getPage(page);
    if (seq !== renderSeq.current) return;
    const base = pdfPage.getViewport({ scale: 1 });
    const fit = Math.min(box.clientWidth / base.width, box.clientHeight / base.height) || 1;
    const dpr = window.devicePixelRatio || 1;
    const viewport = pdfPage.getViewport({ scale: fit * zoom });
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    const ctx = canvas.getContext("2d")!;
    const task = pdfPage.render({ canvas, canvasContext: ctx, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined });
    renderTask.current = task;
    try { await task.promise; } catch (e: any) { if (e?.name !== "RenderingCancelledException") console.error("[pdf render]", e?.message); }
    if (renderTask.current === task) renderTask.current = null;
  }, [page, zoom]);

  useEffect(() => { if (!loading && !error) render(); }, [render, loading, error]);
  useEffect(() => {
    const onResize = () => render();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [render]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); page < total ? setPage(page + 1) : onEndNext(); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); page > 1 ? setPage(page - 1) : onStartPrev(); }
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.1, 3));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.1, 0.5));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, total, onEndNext, onStartPrev]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-auto">
      <div className="flex min-h-full min-w-full items-center justify-center p-2">
        {loading && <div className="text-white/60">Đang tải PDF...</div>}
        {error && <div className="text-destructive-foreground bg-destructive/60 rounded px-4 py-2">{error}</div>}
        <canvas ref={canvasRef} className={loading || error ? "hidden" : "shadow-2xl"} />
      </div>
      {!loading && !error && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs">
          <Button size="sm" variant="ghost" className="h-7 text-white hover:bg-white/10" onClick={() => page > 1 ? setPage(page - 1) : onStartPrev()}><ChevronLeft className="h-4 w-4"/></Button>
          <span className="px-2 tabular-nums">{page} / {total}</span>
          <Button size="sm" variant="ghost" className="h-7 text-white hover:bg-white/10" onClick={() => page < total ? setPage(page + 1) : onEndNext()}><ChevronRight className="h-4 w-4"/></Button>
          <span className="mx-1 h-4 w-px bg-white/20"/>
          <Button size="sm" variant="ghost" className="h-7 text-white hover:bg-white/10" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}><ZoomOut className="h-4 w-4"/></Button>
          <span className="w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="ghost" className="h-7 text-white hover:bg-white/10" onClick={() => setZoom((z) => Math.min(z + 0.1, 3))}><ZoomIn className="h-4 w-4"/></Button>
        </div>
      )}
    </div>
  );
}
