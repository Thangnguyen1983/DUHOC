import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { upsertEntry, getCmsRoles } from "@/lib/cms.functions";
import { EntryForm } from "@/components/cms/entry-form";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/cms/$type/new")({
  component: NewEntry,
});

function NewEntry() {
  const { type } = Route.useParams();
  const navigate = useNavigate();
  const upsert = useServerFn(upsertEntry);
  const fetchRoles = useServerFn(getCmsRoles);
  const rolesQ = useQuery({ queryKey: ["cms-roles"], queryFn: () => fetchRoles() });
  const canPublish = !!(rolesQ.data?.roles.admin || rolesQ.data?.roles.editor);

  const mut = useMutation({
    mutationFn: (v: any) =>
      upsert({
        data: {
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
    onSuccess: (r) => {
      toast.success("Đã tạo bản ghi");
      navigate({ to: "/admin/cms/$type/$id", params: { type, id: r.id } });
    },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground">
        <Link to="/admin/cms" className="hover:text-primary">CMS</Link> ›{" "}
        <Link to="/admin/cms/$type" params={{ type }} className="hover:text-primary">{type}</Link> › Tạo mới
      </div>
      <h1 className="text-2xl font-bold">Tạo bản ghi mới</h1>
      <EntryForm onSubmit={(v) => mut.mutate(v)} loading={mut.isPending} canPublish={canPublish} typeSlug={type} />
    </div>
  );
}
