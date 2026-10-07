import { errorMessage } from "@/lib/errors";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/accept-invite")({
  head: () => ({
    meta: [
      { title: "Kích hoạt tài khoản — KAIZEN" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AcceptInvitePage,
});

const formSchema = z.object({
  full_name: z.string().trim().min(2, "Vui lòng nhập họ tên").max(120),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(200),
});

function AcceptInvitePage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function hydrate() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setReady(true);
        setEmail(data.user.email ?? "");
        const meta = (data.user.user_metadata ?? {}) as { full_name?: string };
        if (meta.full_name) setFullName(meta.full_name);
      }
    }
    hydrate();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "PASSWORD_RECOVERY" || event === "USER_UPDATED") && session?.user) {
        setReady(true);
        setEmail(session.user.email ?? "");
        const meta = (session.user.user_metadata ?? {}) as { full_name?: string };
        if (meta.full_name && !fullName) setFullName(meta.full_name);
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Hai mật khẩu không khớp");
      return;
    }
    const parsed = formSchema.safeParse({ full_name: fullName, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
      return;
    }
    setLoading(true);
    try {
      const { data: updated, error } = await supabase.auth.updateUser({
        password: parsed.data.password,
        data: { full_name: parsed.data.full_name },
      });
      if (error) throw error;
      const uid = updated.user?.id;
      if (uid) {
        await supabase.from("profiles").upsert({ id: uid, full_name: parsed.data.full_name });
      }
      toast.success("Kích hoạt tài khoản thành công");
      // Điều hướng phù hợp: mặc định về /admin (bảo vệ layout sẽ redirect nếu không có quyền)
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Có lỗi xảy ra"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-soft">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Về trang chủ</Link>
        <div className="mt-4 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg gradient-brand text-white font-bold">K</div>
          <div>
            <div className="font-bold">Kích hoạt tài khoản KAIZEN</div>
            <div className="text-xs text-muted-foreground">Thiết lập thông tin lần đầu</div>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-bold">Chào mừng bạn đến với KAIZEN</h1>

        {!ready ? (
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>Đang xác thực lời mời...</p>
            <p>
              Nếu trang này không tự động chuyển, vui lòng mở lại link mời trong email KAIZEN gửi cho bạn.
              Link có hiệu lực trong 24 giờ.
            </p>
            <Link to="/auth" className="inline-block text-primary hover:underline">
              Đã có mật khẩu? Đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {email && (
              <div>
                <Label>Email</Label>
                <Input value={email} readOnly disabled />
              </div>
            )}
            <div>
              <Label htmlFor="full_name">Họ và tên</Label>
              <Input
                id="full_name"
                required
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <Label htmlFor="password">Mật khẩu mới</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 8 ký tự"
              />
            </div>
            <div>
              <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
              <Input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary">
              {loading ? "Đang kích hoạt..." : "Kích hoạt tài khoản"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Bằng việc tiếp tục, bạn đồng ý với{" "}
              <Link to="/dieu-khoan" className="underline">Điều khoản</Link> và{" "}
              <Link to="/chinh-sach-bao-mat" className="underline">Chính sách bảo mật</Link> của KAIZEN.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
