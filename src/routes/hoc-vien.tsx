import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyPortal } from "@/lib/portal/portal.functions";
import { syncMyEnrollments } from "@/lib/courses/orders.functions";
import { LayoutDashboard, User, BookOpen, Bell, NotebookPen, ClipboardCheck, Award, QrCode, Receipt, Menu } from "lucide-react";
import { PortalPreview, PortalSwitcher } from "@/components/portal/portal-switcher";
import { useMyAccess } from "@/lib/rbac/use-access";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/hoc-vien")({
  head: () => ({ meta: [
    { title: "Cổng học viên — KAIZEN" },
    { name: "description", content: "Theo dõi lớp học, bài học và hồ sơ cá nhân tại KAIZEN." },
    { property: "og:title", content: "Cổng học viên — KAIZEN" },
    { property: "og:description", content: "Theo dõi lớp học, bài học và hồ sơ cá nhân tại KAIZEN." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  ssr: false,
  validateSearch: z.object({ preview: z.literal("student").optional() }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: PortalShell,
});

function PortalShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchPortal = useServerFn(getMyPortal);
  const sync = useServerFn(syncMyEnrollments);
  const { preview } = Route.useSearch();
  const wantsPreview = preview === "student";
  const accessQuery = useMyAccess();
  const previewAllowed = wantsPreview && accessQuery.access?.isAdmin === true;
  const { data, isLoading } = useQuery({ queryKey: ["my-portal"], queryFn: () => fetchPortal(), enabled: !wantsPreview });

  const [userEmail, setUserEmail] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ""));
    // Đồng bộ enrollment ngay khi mở portal (kể cả sau đăng nhập lại).
    if (!wantsPreview) sync({}).catch(() => { /* im lặng, không cản trở UI */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if ((!wantsPreview && isLoading) || (wantsPreview && accessQuery.isLoading)) return <div className="grid min-h-screen place-items-center text-muted-foreground">Đang tải Portal...</div>;

  if (wantsPreview && !previewAllowed) {
    return <PreviewDenied />;
  }

  if (!previewAllowed && !data?.isStudent) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/40 px-4">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-soft">
          <h1 className="text-2xl font-bold">Tài khoản này chưa có hồ sơ học viên</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tài khoản <strong>{userEmail}</strong> chưa được gán vai trò <em>học viên</em>.
            {data?.isTeacher ? " Bạn hãy sử dụng Cổng giáo viên để giảng dạy." : " Vui lòng liên hệ tư vấn viên/giáo vụ Kaizen."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {data?.isTeacher && (
              <Button asChild><Link to="/giang-day" search={{}}>Mở Cổng giáo viên</Link></Button>
            )}
            <Button variant="outline" onClick={signOut}>Đăng xuất</Button>
          </div>
        </div>
      </div>
    );
  }

  const roleLabel = previewAllowed ? "Xem thử Học viên" : "Học viên";

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-white font-bold">K</div>
          <div>
            <div className="font-bold">KAIZEN Portal</div>
            <div className="text-[10px] text-muted-foreground">{roleLabel}</div>
          </div>
        </div>
        <nav className="space-y-1 p-3 text-sm">
          <NavItem to="/hoc-vien" icon={LayoutDashboard} exact search={previewAllowed ? { preview: "student" } : {}}>Tổng quan</NavItem>
          <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/ho-so"} icon={User} search={previewAllowed ? { preview: "student" } : {}}>Hồ sơ của tôi</NavItem>
          <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/lop-hoc"} icon={BookOpen} search={previewAllowed ? { preview: "student" } : {}}>Lớp học</NavItem>
          <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/diem-danh"} icon={QrCode} search={previewAllowed ? { preview: "student" } : {}}>Điểm danh QR</NavItem>
          <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/bai-hoc"} icon={NotebookPen} search={previewAllowed ? { preview: "student" } : {}}>Bài học</NavItem>
          <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/bai-kiem-tra"} icon={ClipboardCheck} search={previewAllowed ? { preview: "student" } : {}}>Bài kiểm tra</NavItem>
          <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/chung-chi"} icon={Award} search={previewAllowed ? { preview: "student" } : {}}>Chứng chỉ</NavItem>
          <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/don-hang"} icon={Receipt} search={previewAllowed ? { preview: "student" } : {}}>Đơn hàng của tôi</NavItem>
          <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/thong-bao"} icon={Bell} search={previewAllowed ? { preview: "student" } : {}}>Thông báo</NavItem>
        </nav>

        <div className="px-3 pt-4">
          <div className="rounded-lg bg-muted p-3 text-xs">
            <div className="font-semibold truncate">{userEmail}</div>
            <div className="text-muted-foreground">{roleLabel}</div>
            <div className="mt-2"><PortalSwitcher current="student" email={userEmail} onSignOut={signOut} /></div>
          </div>
        </div>
      </aside>
       <div className="min-w-0 flex-1">
         <header className="grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b bg-card px-4 md:hidden">
           <div className="flex min-w-0 items-center gap-2">
             <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
               <SheetTrigger asChild><Button variant="ghost" size="icon" className="shrink-0" aria-label="Mở menu học viên"><Menu className="h-5 w-5" /></Button></SheetTrigger>
               <SheetContent side="left" className="w-[85vw] max-w-80 overflow-y-auto p-0">
                 <SheetHeader className="border-b p-4 text-left"><SheetTitle>KAIZEN Portal</SheetTitle></SheetHeader>
                 <nav className="space-y-1 p-3 text-sm" onClick={(event) => { if ((event.target as HTMLElement).closest('a')) setMobileNavOpen(false); }}>
                   <NavItem to="/hoc-vien" icon={LayoutDashboard} exact search={previewAllowed ? { preview: "student" } : {}}>Tổng quan</NavItem>
                   <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/ho-so"} icon={User} search={previewAllowed ? { preview: "student" } : {}}>Hồ sơ của tôi</NavItem>
                   <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/lop-hoc"} icon={BookOpen} search={previewAllowed ? { preview: "student" } : {}}>Lớp học</NavItem>
                   <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/diem-danh"} icon={QrCode} search={previewAllowed ? { preview: "student" } : {}}>Điểm danh QR</NavItem>
                   <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/bai-hoc"} icon={NotebookPen} search={previewAllowed ? { preview: "student" } : {}}>Bài học</NavItem>
                   <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/bai-kiem-tra"} icon={ClipboardCheck} search={previewAllowed ? { preview: "student" } : {}}>Bài kiểm tra</NavItem>
                   <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/chung-chi"} icon={Award} search={previewAllowed ? { preview: "student" } : {}}>Chứng chỉ</NavItem>
                   <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/don-hang"} icon={Receipt} search={previewAllowed ? { preview: "student" } : {}}>Đơn hàng của tôi</NavItem>
                   <NavItem to={previewAllowed ? "/hoc-vien" : "/hoc-vien/thong-bao"} icon={Bell} search={previewAllowed ? { preview: "student" } : {}}>Thông báo</NavItem>
                 </nav>
               </SheetContent>
             </Sheet>
             <div className="truncate font-bold">KAIZEN Portal</div>
           </div>
          <PortalSwitcher current="student" email={userEmail} onSignOut={signOut} compact />
        </header>
        {previewAllowed && (
          <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
              <strong>Đang xem thử — dữ liệu mẫu, chỉ đọc.</strong>
              <Button asChild size="sm" variant="outline"><Link to="/admin">Quay lại Cổng quản trị</Link></Button>
            </div>
          </div>
        )}
         <main className="min-w-0 p-4 md:p-8">{previewAllowed ? <PortalPreview kind="student" /> : <Outlet />}</main>
      </div>
    </div>
  );
}

function PreviewDenied() {
  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 px-4">
      <div className="max-w-md rounded-lg border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Không thể mở chế độ xem thử</h1>
        <p className="mt-2 text-sm text-muted-foreground">Chế độ dữ liệu mẫu chỉ dành cho Quản trị viên.</p>
        <Button asChild className="mt-5"><Link to="/hoc-vien" search={{}}>Mở cổng theo quyền thật</Link></Button>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, children, exact, search }: { to: string; icon: any; children: React.ReactNode; exact?: boolean; search?: { preview?: "student" } }) {
  return (
    <Link
      to={to}
      search={search ?? {}}
      className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted"
      activeProps={{ className: "bg-accent text-primary font-semibold" }}
      activeOptions={{ exact: !!exact }}
    >
      <Icon className="h-4 w-4" /> {children}
    </Link>
  );
}
