import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPresentableClasses } from "@/lib/training/curriculum.functions";
import { Presentation, ChevronRight } from "lucide-react";
import { MARKET_LABEL } from "@/components/training/materials-manager";

export const Route = createFileRoute("/giang-day/trinh-chieu/")({
  component: PresentationIndex,
});

function PresentationIndex() {
  const fetchClasses = useServerFn(listPresentableClasses);
  const q = useQuery({ queryKey: ["presentable-classes"], queryFn: () => fetchClasses() });
  const items: any[] = q.data?.items ?? [];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Presentation className="h-6 w-6"/> Trình chiếu lớp học</h1>
        <p className="text-sm text-muted-foreground">Chọn lớp để mở bộ tài liệu đã duyệt lên màn hình giảng dạy. Phím ← → chuyển trang, F toàn màn hình, Esc thoát.</p>
      </div>
      {q.isLoading && <div className="text-muted-foreground">Đang tải danh sách lớp...</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <Link key={c.id} to="/giang-day/trinh-chieu/$classId" params={{ classId: c.id }} className="group rounded-2xl border bg-card p-4 transition hover:border-primary hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{c.code ?? ""} {c.market ? `· ${MARKET_LABEL[c.market] ?? c.market}` : ""}</div>
                <div className="truncate font-bold">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.training_programs?.name ?? ""} {c.training_programs?.level ? `· ${c.training_programs.level}` : ""}</div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:text-primary"/>
            </div>
            <div className="mt-3 flex gap-2 text-xs">
              {c.own && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Lớp của tôi</span>}
              <span className="rounded-full bg-muted px-2 py-0.5">{c.status}</span>
            </div>
          </Link>
        ))}
        {!q.isLoading && items.length === 0 && <div className="col-span-full rounded-2xl border bg-card p-8 text-center text-muted-foreground">Bạn chưa được gán lớp / thị trường nào để trình chiếu.</div>}
      </div>
    </div>
  );
}
