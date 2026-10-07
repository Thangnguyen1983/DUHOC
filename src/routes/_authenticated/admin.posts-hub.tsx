import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPostsHubMatrix } from "@/lib/cms.functions";
import { AlertTriangle, FileText, Send, PencilLine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/posts-hub")({
  component: PostsHub,
});

const MODULES: { slug: string; label: string; markets: { slug: string; label: string }[] }[] = [
  {
    slug: "xkld",
    label: "XKLĐ",
    markets: [
      { slug: "duc", label: "Đức" },
      { slug: "dai-loan", label: "Đài Loan" },
      { slug: "nhat-ban", label: "Nhật Bản" },
      { slug: "han-quoc", label: "Hàn Quốc" },
      { slug: "hungary", label: "Hungary" },
      { slug: "romania", label: "Romania" },
      { slug: "ba-lan", label: "Ba Lan" },
      { slug: "czech", label: "Czech" },
      { slug: "slovakia", label: "Slovakia" },
    ],
  },
  {
    slug: "du-hoc",
    label: "Du học",
    markets: [
      { slug: "duc", label: "Đức" },
      { slug: "han-quoc", label: "Hàn Quốc" },
      { slug: "nhat-ban", label: "Nhật Bản" },
      { slug: "dai-loan", label: "Đài Loan" },
      { slug: "canada", label: "Canada" },
      { slug: "chau-au", label: "Châu Âu" },
    ],
  },
  {
    slug: "ngoai-ngu",
    label: "Ngoại ngữ",
    markets: [
      { slug: "duc", label: "Tiếng Đức" },
      { slug: "han-quoc", label: "Tiếng Hàn" },
      { slug: "nhat-ban", label: "Tiếng Nhật" },
      { slug: "anh", label: "Tiếng Anh" },
    ],
  },
];

function PostsHub() {
  const fetchMatrix = useServerFn(getPostsHubMatrix);
  const { data, isLoading } = useQuery({
    queryKey: ["posts-hub-matrix"],
    queryFn: () => fetchMatrix(),
  });

  const rows = data?.rows ?? [];
  const totals = data?.totals ?? { total: 0, published: 0, draft: 0, missingTaxonomy: 0 };

  const countCell = (module: string, market: string) => {
    const cellRows = rows.filter((r) => r.module === module && r.market === market);
    const pub = cellRows.filter((r) => r.status === "published").length;
    const draft = cellRows.filter((r) => r.status !== "published").length;
    return { total: cellRows.length, pub, draft };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">
            <Link to="/admin/cms" className="hover:text-primary">← CMS</Link>
          </div>
          <h1 className="text-2xl font-bold">Ma trận bài viết theo thị trường</h1>
          <p className="text-sm text-muted-foreground">
            Tổng quan nội dung <b>post</b> phân bổ theo module × thị trường. Click vào ô để xem/lọc.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/cms/$type/new" params={{ type: "post" }}>
            <Plus className="mr-1 h-4 w-4" /> Bài viết mới
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<FileText className="h-4 w-4" />} label="Tổng bài" value={totals.total} />
        <StatCard icon={<Send className="h-4 w-4" />} label="Đã đăng" value={totals.published} tone="ok" />
        <StatCard icon={<PencilLine className="h-4 w-4" />} label="Nháp / chờ" value={totals.draft} tone="muted" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Thiếu module/thị trường" value={totals.missingTaxonomy} tone="warn" />
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Đang tải...</div>}

      {MODULES.map((m) => (
        <div key={m.slug} className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">{m.label}</h2>
            <Link
              to="/admin/cms/$type"
              params={{ type: "post" }}
              className="text-xs text-primary hover:underline"
            >
              Xem tất cả {m.label} →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Thị trường</th>
                  <th className="px-4 py-2">Tổng</th>
                  <th className="px-4 py-2">Đã đăng</th>
                  <th className="px-4 py-2">Nháp/chờ</th>
                  <th className="px-4 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {m.markets.map((mk) => {
                  const c = countCell(m.slug, mk.slug);
                  const empty = c.total === 0;
                  return (
                    <tr key={mk.slug} className={empty ? "opacity-60" : ""}>
                      <td className="px-4 py-2 font-medium">{mk.label}</td>
                      <td className="px-4 py-2">{c.total}</td>
                      <td className="px-4 py-2 text-secondary">{c.pub}</td>
                      <td className="px-4 py-2 text-muted-foreground">{c.draft}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              to="/admin/cms/$type"
                              params={{ type: "post" }}
                              search={{ module: m.slug, market: mk.slug } as any}
                            >
                              Xem
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link to="/admin/cms/$type/new" params={{ type: "post" }}>
                              + Bài
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: "ok" | "warn" | "muted" }) {
  const cls =
    tone === "ok"
      ? "bg-secondary/10 text-secondary"
      : tone === "warn"
      ? "bg-orange-100 text-orange-700"
      : tone === "muted"
      ? "bg-muted text-muted-foreground"
      : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`rounded-full p-1.5 ${cls}`}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
    </div>
  );
}
