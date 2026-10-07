import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, ListChecks, Search, Users } from "lucide-react";
import { GUIDES } from "@/lib/help/guides";
import { useMyAccess } from "@/lib/rbac/use-access";

export const Route = createFileRoute("/_authenticated/admin/huong-dan/")({
  head: () => ({
    meta: [
      { title: "Hướng dẫn sử dụng hệ thống — KAIZEN Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HelpIndex,
});

function HelpIndex() {
  const { access } = useMyAccess();
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);

  const perms = access?.permissions ?? [];
  const mine = useMemo(
    () => GUIDES.filter((g) => g.permissions.some((p) => perms.includes(p))),
    [perms],
  );

  const base = all || mine.length === 0 ? GUIDES : mine;
  const keyword = q.trim().toLowerCase();
  const list = keyword
    ? base.filter((g) =>
        [g.title, g.department, g.summary, ...g.sections.map((s) => s.title)]
          .join(" ")
          .toLowerCase()
          .includes(keyword),
      )
    : base;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hướng dẫn sử dụng hệ thống</h1>
        <p className="text-sm text-muted-foreground">
          Tài liệu thao tác cho từng bộ phận: quy trình chuẩn, quy tắc bắt buộc và cách xử lý lỗi thường gặp.
        </p>
      </div>

      <Link to="/admin/huong-dan/quy-trinh" className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10">
        <ListChecks className="h-6 w-6 shrink-0 text-primary" />
        <span><b className="block">Quy trình nghiệp vụ từng bước</b><span className="text-sm text-muted-foreground">Ai làm, làm ở đâu, cần gì, thế nào là xong — cho từng phòng ban.</span></span>
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo bộ phận hoặc nội dung (vd: điểm danh, UTM, visa)..."
            className="w-full rounded-md border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => setAll((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Users className="h-4 w-4" />
          {all ? "Chỉ phần của tôi" : "Xem tất cả bộ phận"}
        </button>
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Không tìm thấy hướng dẫn phù hợp. Thử từ khoá khác hoặc bấm “Xem tất cả bộ phận”.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((g) => (
            <Link
              key={g.slug}
              to="/admin/huong-dan/$slug"
              params={{ slug: g.slug }}
              className="group flex flex-col rounded-xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-soft"
            >
              <div className="flex items-center gap-2 text-primary">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">{g.department}</span>
              </div>
              <h2 className="mt-2 text-base font-bold group-hover:text-primary">{g.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{g.summary}</p>
              <span className="mt-3 text-xs font-medium text-primary">
                {g.sections.length} mục hướng dẫn →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
