import { errorMessage } from "@/lib/errors";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { getMyRoles } from "@/lib/roles.functions";
import { defaultPortal, PORTAL_PATH } from "@/lib/rbac/portal";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { publicUrl } from "@/lib/site-url";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

const authSearchSchema = z.object({
  mode: fallback(z.enum(["login", "signup", "forgot"]), "login").default("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(authSearchSchema),
  head: () => ({
    meta: [
      { title: "Đăng nhập quản trị — KAIZEN" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const goToMyPortal = useCallback(async () => {
    try {
      const me = (await getMyRoles()) as { roles: string[]; permissions: string[] };
      const target = PORTAL_PATH[defaultPortal(me.roles ?? [], me.permissions?.length ?? 0)];
      navigate({ to: target, replace: true });
    } catch {
      navigate({ to: "/admin", replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void goToMyPortal();
    });
  }, [goToMyPortal]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Đăng nhập thành công");
        await goToMyPortal();
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: publicUrl("/admin") },
        });
        if (error) throw error;
        toast.success("Đã tạo tài khoản. Hãy đăng nhập (admin sẽ cấp quyền).");
        setMode("login");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: publicUrl("/reset-password"),
        });
        if (error) throw error;
        toast.success("Đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra email.");
        setMode("login");
      }
    } catch (err) {
      toast.error(errorMessage(err, "Có lỗi xảy ra"));
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "login" ? "Đăng nhập" : mode === "signup" ? "Tạo tài khoản" : "Quên mật khẩu";
  const submitLabel = loading
    ? "Đang xử lý..."
    : mode === "login" ? "Đăng nhập" : mode === "signup" ? "Tạo tài khoản" : "Gửi link đặt lại";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-soft">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Về trang chủ</Link>
        <div className="mt-4 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg gradient-brand text-white font-bold">K</div>
          <div>
            <div className="font-bold">KAIZEN Admin</div>
            <div className="text-xs text-muted-foreground">Khu vực quản trị</div>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-bold">{title}</h1>
        {mode === "forgot" && (
          <p className="mt-2 text-sm text-muted-foreground">
            Nhập email tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu.
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-primary hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full bg-primary">{submitLabel}</Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "login" && (
            <button onClick={() => setMode("signup")} className="hover:text-primary">
              Chưa có tài khoản? Tạo mới
            </button>
          )}
          {mode === "signup" && (
            <button onClick={() => setMode("login")} className="hover:text-primary">
              Đã có tài khoản? Đăng nhập
            </button>
          )}
          {mode === "forgot" && (
            <button onClick={() => setMode("login")} className="hover:text-primary">
              ← Quay lại đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
