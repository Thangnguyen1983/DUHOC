import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEntry,
  upsertEntry,
  listRevisions,
  revertRevision,
  getCmsRoles,
} from "@/lib/cms.functions";
import { EntryForm } from "@/components/cms/entry-form";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/cms/$type/$id")({
  component: EditEntry,
});

function EditEntry() {
  const { type, id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchEntry = useServerFn(getEntry);
  const fetchRevs = useServerFn(listRevisions);
  const fetchRoles = useServerFn(getCmsRoles);
  const upsert = useServerFn(upsertEntry);
  const revert = useServerFn(revertRevision);

  const entryQ = useQuery({ queryKey: ["cms-entry", id], queryFn: () => fetchEntry({ data: { id } }) });
  const revsQ = useQuery({ queryKey: ["cms-revs", id], queryFn: () => fetchRevs({ data: { entryId: id } }) });
  const rolesQ = useQuery({ queryKey: ["cms-roles"], queryFn: () => fetchRoles() });
  const canPublish = !!(rolesQ.data?.roles.admin || rolesQ.data?.roles.editor);

  const mut = useMutation({
    mutationFn: (v: any) =>
      upsert({
        data: {
          id,
          content_type_slug: type,
          slug: v.slug,
          title: v.title,
          excerpt: v.excerpt,
          cover_image: v.cover_image,
          data: v.data,
          seo: v.seo,
          status: v.status,
          scheduled_at: v.scheduled_at,
          revision_note: v.revision_note,
          category_ids: v.category_ids ?? [],
          tag_ids: v.tag_ids ?? [],
          module: v.module || null,
          market: v.market || null,
          pinned: !!v.pinned,
          featured: !!v.featured,
        },
      }),
    onSuccess: () => {
      toast.success("Đã lưu");
      qc.invalidateQueries({ queryKey: ["cms-entry", id] });
      qc.invalidateQueries({ queryKey: ["cms-revs", id] });
    },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });

  const mRevert = useMutation({
    mutationFn: (revisionId: string) => revert({ data: { entryId: id, revisionId } }),
    onSuccess: () => {
      toast.success("Đã khôi phục phiên bản");
      qc.invalidateQueries({ queryKey: ["cms-entry", id] });
      qc.invalidateQueries({ queryKey: ["cms-revs", id] });
    },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });

  if (entryQ.isLoading) return <div className="text-muted-foreground">Đang tải...</div>;
  if (!entryQ.data?.entry) return <div className="text-destructive">Không tìm thấy bản ghi</div>;

  const e = entryQ.data.entry as any;

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground">
        <Link to="/admin/cms" className="hover:text-primary">CMS</Link> ›{" "}
        <Link to="/admin/cms/$type" params={{ type }} className="hover:text-primary">{type}</Link> ›{" "}
        Sửa
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{e.title}</h1>
        <div className="text-xs text-muted-foreground">Phiên bản v{e.version}</div>
      </div>

      <EntryForm
        initial={{
          slug: e.slug,
          title: e.title,
          excerpt: e.excerpt ?? "",
          cover_image: e.cover_image ?? "",
          data: e.data ?? {},
          seo: e.seo ?? {},
          status: e.status,
          scheduled_at: e.scheduled_at,
          category_ids: entryQ.data?.category_ids ?? [],
          tag_ids: entryQ.data?.tag_ids ?? [],
          module: (e.module as any) ?? "",
          market: e.market ?? "",
          pinned: !!e.pinned,
          featured: !!e.featured,
        }}
        loading={mut.isPending}
        canPublish={canPublish}
        typeSlug={type}
        onSubmit={(v) => mut.mutate(v)}
      />

      <div className="mt-6 rounded-2xl border bg-card p-4">
        <div className="text-sm font-semibold">Lịch sử chỉnh sửa</div>
        <div className="mt-2 divide-y">
          {revsQ.data?.items.length === 0 && (
            <div className="py-4 text-xs text-muted-foreground">Chưa có phiên bản trước.</div>
          )}
          {(revsQ.data?.items ?? []).map((r: any) => (
            <div key={r.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium">v{r.version} — {r.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("vi-VN")} • {r.status}
                  {r.note && ` • ${r.note}`}
                </div>
              </div>
              {canPublish && (
                <button
                  onClick={() => { if (confirm("Khôi phục phiên bản này?")) mRevert.mutate(r.id); }}
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                >
                  <RotateCcw className="h-3 w-3" /> Khôi phục
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
