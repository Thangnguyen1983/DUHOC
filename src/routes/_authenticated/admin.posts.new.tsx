import { errorMessage } from "@/lib/errors";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { createPost } from "@/lib/posts.functions";
import { PostForm } from "@/components/post-form";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/posts/new")({
  component: NewPost,
});

function NewPost() {
  const create = useServerFn(createPost);
  const navigate = useNavigate();
  const mut = useMutation({
    mutationFn: (data: any) => create({ data }),
    onSuccess: () => {
      toast.success("Đã tạo bài viết");
      navigate({ to: "/admin/posts" });
    },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tạo bài viết mới</h1>
      <PostForm onSubmit={(d) => mut.mutate(d)} submitLabel="Tạo bài viết" loading={mut.isPending} />
    </div>
  );
}
