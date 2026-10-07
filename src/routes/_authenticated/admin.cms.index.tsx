import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listContentTypes } from "@/lib/cms.functions";
import { FileText, Briefcase, LayoutTemplate, HelpCircle, FileCheck, Award, FolderKanban, File, Percent, Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/cms/")({
  component: CmsIndex,
});

const iconMap: Record<string, any> = {
  FileText, Briefcase, LayoutTemplate, HelpCircle, FileCheck, Award, FolderKanban, File, Percent, Layers,
};

function CmsIndex() {
  const fetchTypes = useServerFn(listContentTypes);
  const { data, isLoading } = useQuery({ queryKey: ["cms-types"], queryFn: () => fetchTypes() });

  if (isLoading) return <div className="text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CMS tập trung</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý toàn bộ nội dung website từ một nơi. Mỗi loại nội dung có template và trường dữ liệu riêng,
          dùng chung nền tảng CRUD / SEO / Workflow / Media / Phân quyền.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.items ?? []).map((t: any) => {
          const Icon = iconMap[t.icon ?? "FileText"] ?? FileText;
          return (
            <Link
              key={t.id}
              to="/admin/cms/$type"
              params={{ type: t.slug }}
              className="group rounded-2xl border bg-card p-5 shadow-soft transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold group-hover:text-primary">{t.name}</div>
                  {t.description && <div className="mt-1 text-xs text-muted-foreground">{t.description}</div>}
                  <div className="mt-2 text-[11px] text-muted-foreground">Slug: <code>{t.slug}</code></div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}

