import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeachingOverview } from "@/lib/training/teaching.functions";
import { LayoutDashboard, CalendarDays, BookOpen, GraduationCap, Folder, ClipboardCheck, Award, Presentation, Menu } from "lucide-react";
import { PortalPreview, PortalSwitcher } from "@/components/portal/portal-switcher";
import { useMyAccess } from "@/lib/rbac/use-access";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/giang-day")({
  head: () => ({ meta: [
    { title: "Phòng dạy — KAIZEN" },
    { name: "description", content: "Quản lý lớp học, tài liệu và lịch dạy tại KAIZEN." },
    { property: "og:title", content: "Phòng dạy — KAIZEN" },
    { property: "og:description", content: "Quản lý lớp học, tài liệu và lịch dạy tại KAIZEN." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  ssr: false,
  validateSearch: z.object({ preview: z.literal("teacher").optional() }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: TeachShell,
});

function TeachShell() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchOverview = useServerFn(getTeachingOverview);
  const { preview } = Route.useSearch();
  const wantsPreview = preview === "teacher";
  const accessQuery = useMyAccess();
  const previewAllowed = wantsPreview && accessQuery.access?.isAdmin === true;
  const { data, isLoading, error } = useQuery({ queryKey: ["teaching-overview"], queryFn: () => fetchOverview(), enabled: !wantsPreview });
  const [email, setEmail] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if ((!wantsPreview && isLoading) || (wantsPreview && accessQuery.isLoading)) return <div className="grid min-h-screen place-items-center text-muted-foreground">Đang tải phòng dạy...</div>;

  if (wantsPreview && !previewAllowed) {
    return <PreviewDenied />;
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/40 px-4">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center">
          <h1 className="text-2xl font-bold">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tài khoản <strong>{email}</strong> cần vai trò <em>Giáo viên</em> hoặc <em>Giáo vụ</em> để dùng khu vực giảng dạy.
          </p>
          <button onClick={signOut} className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Đăng xuất</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-white font-bold">K</div>
          <div>
            <div className="font-bold">Phòng dạy</div>
            <div className="text-[10px] text-muted-foreground">{previewAllowed ? "Xem thử Giáo viên" : data?.isStaff ? "Giáo vụ" : "Giáo viên"}</div>
          </div>
        </div>
        <nav className="space-y-1 p-3 text-sm">
          <NavItem to="/giang-day" icon={LayoutDashboard} exact search={previewAllowed ? { preview: "teacher" } : {}}>Tổng quan</NavItem>
          <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/lich"} icon={CalendarDays} search={previewAllowed ? { preview: "teacher" } : {}}>Lịch dạy</NavItem>
          <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/lop"} icon={BookOpen} search={previewAllowed ? { preview: "teacher" } : {}}>Lớp của tôi</NavItem>
          <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/giam-sat"} icon={GraduationCap} search={previewAllowed ? { preview: "teacher" } : {}}>Giám sát lớp học</NavItem>
          <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/tai-lieu"} icon={Folder} search={previewAllowed ? { preview: "teacher" } : {}}>Tài liệu học tập</NavItem>
          <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/trinh-chieu"} icon={Presentation} search={previewAllowed ? { preview: "teacher" } : {}}>Trình chiếu</NavItem>
          <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/bai-kiem-tra"} icon={ClipboardCheck} search={previewAllowed ? { preview: "teacher" } : {}}>Bài kiểm tra</NavItem>
          <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/chung-chi"} icon={Award} search={previewAllowed ? { preview: "teacher" } : {}}>Chứng chỉ</NavItem>
        </nav>
        <div className="px-3 pt-4">
          <div className="rounded-lg bg-muted p-3 text-xs">
            <div className="truncate font-semibold">{email}</div>
            <div className="mt-2"><PortalSwitcher current="teacher" email={email} onSignOut={signOut} /></div>
          </div>
        </div>
      </aside>
       <div className="min-w-0 flex-1">
         <header className="grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b bg-card px-4 md:hidden">
           <div className="flex min-w-0 items-center gap-2">
             <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
               <SheetTrigger asChild><Button variant="ghost" size="icon" className="shrink-0" aria-label="Mở menu giáo viên"><Menu className="h-5 w-5" /></Button></SheetTrigger>
               <SheetContent side="left" className="w-[85vw] max-w-80 overflow-y-auto p-0">
                 <SheetHeader className="border-b p-4 text-left"><SheetTitle>Phòng dạy Kaizen</SheetTitle></SheetHeader>
                 <nav className="space-y-1 p-3 text-sm" onClick={(event) => { if ((event.target as HTMLElement).closest('a')) setMobileNavOpen(false); }}>
                   <NavItem to="/giang-day" icon={LayoutDashboard} exact search={previewAllowed ? { preview: "teacher" } : {}}>Tổng quan</NavItem>
                   <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/lich"} icon={CalendarDays} search={previewAllowed ? { preview: "teacher" } : {}}>Lịch dạy</NavItem>
                   <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/lop"} icon={BookOpen} search={previewAllowed ? { preview: "teacher" } : {}}>Lớp của tôi</NavItem>
                   <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/giam-sat"} icon={GraduationCap} search={previewAllowed ? { preview: "teacher" } : {}}>Giám sát lớp học</NavItem>
                   <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/tai-lieu"} icon={Folder} search={previewAllowed ? { preview: "teacher" } : {}}>Tài liệu học tập</NavItem>
                   <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/trinh-chieu"} icon={Presentation} search={previewAllowed ? { preview: "teacher" } : {}}>Trình chiếu</NavItem>
                   <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/bai-kiem-tra"} icon={ClipboardCheck} search={previewAllowed ? { preview: "teacher" } : {}}>Bài kiểm tra</NavItem>
                   <NavItem to={previewAllowed ? "/giang-day" : "/giang-day/chung-chi"} icon={Award} search={previewAllowed ? { preview: "teacher" } : {}}>Chứng chỉ</NavItem>
                 </nav>
               </SheetContent>
             </Sheet>
             <div className="truncate font-bold">Phòng dạy Kaizen</div>
           </div>
          <PortalSwitcher current="teacher" email={email} onSignOut={signOut} compact />
        </header>
        {previewAllowed && (
          <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
              <strong>Đang xem thử — dữ liệu mẫu, chỉ đọc.</strong>
              <Button asChild size="sm" variant="outline"><Link to="/admin">Quay lại Cổng quản trị</Link></Button>
            </div>
          </div>
        )}
         <main className="min-w-0 p-4 md:p-8">{previewAllowed ? <PortalPreview kind="teacher" /> : <Outlet />}</main>
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
        <Button asChild className="mt-5"><Link to="/giang-day" search={{}}>Mở cổng theo quyền thật</Link></Button>
      </div>
    </div>
  );
}

type TeachNav =
  | "/giang-day"
  | "/giang-day/lich"
  | "/giang-day/lop"
  | "/giang-day/giam-sat"
  | "/giang-day/tai-lieu"
  | "/giang-day/trinh-chieu"
  | "/giang-day/bai-kiem-tra"
  | "/giang-day/chung-chi";

function NavItem({ to, icon: Icon, children, exact, search }: { to: TeachNav; icon: any; children: React.ReactNode; exact?: boolean; search?: { preview?: "teacher" } }) {
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
