import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ImageOff, ZoomIn } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { isFileNameCaption } from "@/lib/article-content";
import { cn } from "@/lib/utils";

type Item = { src: string; alt?: string };

type Ctx = {
  register: (item: Item) => number;
  open: (src: string) => void;
  /** Tiêu đề bài viết — dùng sinh alt có ngữ nghĩa khi alt gốc là tên file. */
  title?: string;
};


const ArticleMediaCtx = createContext<Ctx | null>(null);

/**
 * Bọc phần nội dung bài viết: gom mọi ảnh trong bài để mở lightbox,
 * hỗ trợ cả nhánh Markdown lẫn nhánh HTML thuần (event delegation).
 */
export function ArticleMedia({
  children,
  className,
  title,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { title?: string }) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemsRef = useRef<Item[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const [, force] = useState(0);

  const register = useCallback((item: Item) => {
    if (!item.src) return 0;
    const found = itemsRef.current.findIndex((i) => i.src === item.src);
    if (found >= 0) return found;
    itemsRef.current = [...itemsRef.current, item];
    return itemsRef.current.length - 1;
  }, []);

  const collectFromDom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const imgs = Array.from(el.querySelectorAll("img")) as HTMLImageElement[];
    const list = imgs
      .filter((i) => i.getAttribute("src"))
      .map((i) => ({ src: i.getAttribute("src") as string, alt: i.alt || undefined }));
    // Giữ thứ tự xuất hiện thật trong DOM
    itemsRef.current = list.length ? list : itemsRef.current;
  }, []);

  const open = useCallback(
    (src: string) => {
      collectFromDom();
      const i = itemsRef.current.findIndex((it) => it.src === src);
      setIndex(i >= 0 ? i : 0);
      force((n) => n + 1);
    },
    [collectFromDom],
  );

  // Nhánh HTML thuần: bắt click vào ảnh
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.tagName !== "IMG") return;
      if (target.closest("a")) return;
      const src = target.getAttribute("src");
      if (!src) return;
      e.preventDefault();
      open(src);
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [open]);

  const ctx = useMemo<Ctx>(() => ({ register, open, title }), [register, open, title]);
  const items = itemsRef.current;
  const current = index != null ? items[index] : null;

  useEffect(() => {
    if (index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") setIndex((i) => (i == null ? i : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setIndex((i) => (i == null ? i : (i - 1 + items.length) % items.length));
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, items.length]);

  return (
    <ArticleMediaCtx.Provider value={ctx}>
      <section
        ref={containerRef as React.RefObject<HTMLElement>}
        className={cn("article-body", className)}
        {...rest}
      >
        {children}
      </section>

      {current && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/95 p-4 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={current.alt || "Xem ảnh"}
          onClick={() => setIndex(null)}
        >
          <button
            type="button"
            aria-label="Đóng"
            className="absolute right-4 top-4 rounded-full bg-background/90 p-2 text-foreground shadow-lg transition hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              setIndex(null);
            }}
          >
            <X className="h-5 w-5" />
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Ảnh trước"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 text-foreground shadow-lg transition hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i == null ? i : (i - 1 + items.length) % items.length));
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Ảnh sau"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 text-foreground shadow-lg transition hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i == null ? i : (i + 1) % items.length));
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <figure className="max-h-full w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={current.src}
              alt={current.alt || ""}
              loading="eager"
              decoding="async"
              className="mx-auto max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-2xl animate-scale-in"
            />
            {!isFileNameCaption(current.alt) && (
              <figcaption className="mt-3 text-center text-sm text-background/90">
                {current.alt}
                {items.length > 1 && (
                  <span className="ml-2 opacity-70">
                    ({(index ?? 0) + 1}/{items.length})
                  </span>
                )}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </ArticleMediaCtx.Provider>
  );
}

/** Khung ảnh chuẩn dùng trong nội dung bài (Markdown & HTML). */
export function ArticleFigure({
  src,
  alt,
  title,
  caption: captionProp,
  className,
}: {
  src?: string;
  alt?: string;
  title?: string;
  caption?: string;
  className?: string;
}) {
  const ctx = useContext(ArticleMediaCtx);
  const { ref, inView } = useInView<HTMLElement>();
  const [error, setError] = useState(false);
  const rawCaption = captionProp || title || alt;
  const caption = isFileNameCaption(rawCaption) ? undefined : rawCaption;
  const [order, setOrder] = useState(0);
  // Alt chuẩn SEO: bỏ alt dạng tên file, thay bằng tiêu đề bài + số thứ tự ảnh.
  const seoAlt =
    caption ||
    (isFileNameCaption(alt)
      ? ctx?.title
        ? `${ctx.title} — hình ${order + 1}`
        : ""
      : alt) ||
    "";

  useEffect(() => {
    if (src) setOrder(ctx?.register({ src, alt: seoAlt || undefined }) ?? 0);
  }, [src, seoAlt, ctx]);

  if (!src) return null;

  return (
    <figure
      ref={ref}
      className={cn(
        "not-prose group my-8 transition-all duration-700",
        inView ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
    >
      <button
        type="button"
        aria-label={caption ? `Phóng to ảnh: ${caption}` : "Phóng to ảnh"}
        onClick={() => ctx?.open(src)}
        className="relative block w-full overflow-hidden rounded-2xl border bg-muted shadow-sm transition-shadow duration-300 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {error ? (
          <span className="flex h-48 w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <ImageOff className="h-6 w-6" />
            Không tải được ảnh
          </span>
        ) : (
          <>
            <img
              src={src}
              alt={seoAlt}
              loading="lazy"
              decoding="async"
              onError={() => setError(true)}
              className="mx-auto max-h-[70vh] w-auto max-w-full object-contain transition-transform duration-500 motion-safe:group-hover:scale-[1.02]"
            />
            <span className="pointer-events-none absolute right-3 top-3 hidden rounded-full bg-background/85 p-2 text-foreground opacity-0 shadow transition-opacity duration-300 group-hover:opacity-100 md:block">
              <ZoomIn className="h-4 w-4" />
            </span>
          </>
        )}
      </button>
      {caption && (
        <figcaption className="mt-3 text-center text-sm italic text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Lưới ảnh khi có 2–3 ảnh đứng liền nhau trong bài. */
export function ArticleFigureGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose my-8 grid items-start gap-4 sm:grid-cols-2">
      {children}
    </div>
  );
}

/** Lấy text thuần từ node hast. */
function nodeText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return String(node.value ?? "");
  return (node.children ?? []).map(nodeText).join("");
}

function findImg(node: any): any | null {
  if (!node) return null;
  if (node.tagName === "img") return node;
  for (const c of node.children ?? []) {
    const found = findImg(c);
    if (found) return found;
  }
  return null;
}

/** <figure> từ HTML thuần → khung ảnh chuẩn (tránh figure lồng figure). */
export function ArticleFigureFromHtml({ node, children }: any) {
  const img = findImg(node);
  if (!img?.properties?.src) return <figure className="my-8">{children}</figure>;
  const capNode = (node?.children ?? []).find((c: any) => c.tagName === "figcaption");
  return (
    <ArticleFigure
      src={img.properties.src}
      alt={img.properties.alt}
      title={img.properties.title}
      caption={capNode ? nodeText(capNode).trim() : undefined}
      className="my-0"
    />
  );
}

/** <div class="figure-grid"> → lưới ảnh. */
export function ArticleDiv({ node, children, className, ...rest }: any) {
  const cls = className ?? "";
  if (typeof cls === "string" && cls.includes("figure-grid")) {
    return <ArticleFigureGrid>{children}</ArticleFigureGrid>;
  }
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}

/**
 * Đoạn văn trong Markdown: nếu chỉ chứa ảnh thì bỏ thẻ <p> (tránh figure lồng trong p),
 * 2–3 ảnh liền nhau sẽ xếp lưới.
 */
export function ArticleParagraph({ node, children }: any) {
  const elements = (node?.children ?? []).filter(
    (c: any) => !(c.type === "text" && !String(c.value ?? "").trim()),
  );
  const imgs = elements.filter((c: any) => c.tagName === "img");

  if (elements.length > 0 && imgs.length === elements.length) {
    const figures = imgs.map((c: any, i: number) => (
      <ArticleFigure
        key={c.properties?.src ?? i}
        src={c.properties?.src}
        alt={c.properties?.alt}
        title={c.properties?.title}
        className={imgs.length > 1 ? "my-0" : undefined}
      />
    ));
    return imgs.length > 1 ? <ArticleFigureGrid>{figures}</ArticleFigureGrid> : <>{figures}</>;
  }

  return <p>{children}</p>;
}

/** Bộ components dùng chung cho ReactMarkdown ở mọi trang bài viết. */
export const articleMarkdownComponents = {
  h1: ({ children, ...p }: any) => <h2 {...p}>{children}</h2>,
  img: ({ src, alt, title }: any) => <ArticleFigure src={src} alt={alt} title={title} />,
  figure: ArticleFigureFromHtml,
  div: ArticleDiv,
  p: ArticleParagraph,
  table: ({ children }: any) => (
    <div className="my-6 overflow-x-auto rounded-xl border">
      <table className="w-full">{children}</table>
    </div>
  ),
};

