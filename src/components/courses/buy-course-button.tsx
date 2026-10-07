import { errorMessage } from "@/lib/errors";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { createCourseOrder } from "@/lib/courses/orders.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function BuyCourseButton({ courseId, isFree }: { courseId: string; isFree: boolean }) {
  const create = useServerFn(createCourseOrder);
  const nav = useNavigate();
  const mut = useMutation({
    mutationFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        const back = typeof window !== "undefined" ? window.location.pathname : "/khoa-hoc";
        nav({ to: "/auth", search: { next: back } as any });
        throw new Error("Vui lòng đăng nhập để mua khoá học");
      }
      return create({ data: { courseIds: [courseId], customerEmail: data.user.email ?? undefined } });
    },
    onSuccess: (order) => {
      if (order.status === "paid") { toast.success("Đã cấp khoá học miễn phí!"); nav({ to: "/hoc-vien/lop-hoc" }); }
      else nav({ to: "/thanh-toan/$id", params: { id: order.id } });
    },
    onError: (e: any) => { if (e?.message && !e.message.includes("đăng nhập")) toast.error(errorMessage(e)); },
  });

  return (
    <Button size="lg" className="w-full" disabled={mut.isPending} onClick={() => mut.mutate()}>
      {mut.isPending ? "Đang xử lý..." : isFree ? "Đăng ký học miễn phí" : "Mua khoá học ngay"}
    </Button>
  );
}
