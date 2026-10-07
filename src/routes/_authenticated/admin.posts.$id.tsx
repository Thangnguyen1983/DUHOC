import { errorMessage } from "@/lib/errors";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getPostById, updatePost } from "@/lib/posts.functions";
import { PostForm } from "@/components/post-form";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/posts/$id")({
  component: EditPost,
});

function EditPost() {
  const { id } = Route.useParams();
  const fetchPost = useServerFn(getPostById);
  const update = useServerFn(updatePost);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-post", id],
    queryFn: () => fetchPost({ data: { id } }),
  });

  const mut = useMutation({
    mutationFn: (formData: any) => update({ data: { ...formData, id } }),
    onSuccess: () => {
      toast.success("Đã lưu");
      navigate({ to: "/admin/posts" });
    },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });

  if (isLoading) return <div className="text-muted-foreground">Đang tải...</div>;
  if (!data?.post) return <div className="text-destructive">Không tìm thấy bài viết</div>;

  const p = data.post;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sửa bài viết</h1>
      <PostForm
        initial={{
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt ?? "",
          content: p.content ?? "",
          cover_image: p.cover_image ?? "",
          category: p.category ?? "",
          published: p.published,
        }}
        onSubmit={(d) => mut.mutate(d)}
        submitLabel="Lưu thay đổi"
        loading={mut.isPending}
      />
    </div>
  );
}
