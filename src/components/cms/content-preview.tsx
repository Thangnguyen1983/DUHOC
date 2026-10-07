import { useEffect, useState } from "react";

/** Xem trước nội dung bài viết (render Markdown/HTML, có làm sạch). */
export function ContentPreview({ body }: { body: string }) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ marked }, DOMPurify] = await Promise.all([
        import("marked"),
        import("isomorphic-dompurify").then((m) => m.default),
      ]);
      const raw = await marked.parse(body ?? "", { async: true });
      const clean = DOMPurify.sanitize(raw, {
        ADD_TAGS: ["iframe", "figure", "figcaption"],
        ADD_ATTR: [
          "allow",
          "allowfullscreen",
          "frameborder",
          "loading",
          "target",
          "style",
          "src",
          "title",
        ],
      });
      if (alive) setHtml(clean);
    })();
    return () => {
      alive = false;
    };
  }, [body]);

  if (!body?.trim()) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Chưa có nội dung để xem trước.
      </div>
    );
  }

  return (
    <article
      className="prose prose-slate max-w-none rounded-xl border bg-card p-5 prose-headings:font-bold prose-img:rounded-xl prose-a:text-primary"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
