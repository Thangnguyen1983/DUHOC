import { createFileRoute, Outlet, redirect, Link, Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useMyAccess } from "@/lib/rbac/use-access";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { requiredPermissionForPath, editPermissionForPath, PERMISSION_LABEL, type Permission } from "@/lib/rbac/permissions";
import { roleLabel } from "@/lib/rbac/catalog";
import { canUseAdminConsole } from "@/lib/rbac/portal";
import { PortalSwitcher } from "@/components/portal/portal-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { guideForPath } from "@/lib/help/guides";
import { workflowForPath } from "@/lib/help/workflows";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { ListChecks, BarChart3, LayoutDashboard, MessageSquare, FileText, LogOut, Image as ImageIcon, Bot, BookOpen, Sparkles, GraduationCap, Images, Milestone as MilestoneIcon, Flame, Megaphone, School, Users, ChevronDown, FolderOpen, Settings as SettingsIcon, Cog, IdCard, AlertTriangle, UserCog, ClipboardCheck, Award, Folder, Layers, Home, PlayCircle, ShoppingCart, Ticket, Lock, LifeBuoy, Menu, Plane, ShieldCheck, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AdminShell,
});

function AdminShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { access, isLoading, can, canAny } = useMyAccess();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Đang tải...</div>;
  }

  const roles = access?.roles ?? [];
  const hasConsoleAccess = canUseAdminConsole(roles, access?.permissions?.length ?? 0);

  // Tài khoản chỉ là giáo viên: luôn làm việc tại Cổng giáo viên.
  if (!hasConsoleAccess && roles.includes("teacher")) {
    return <Navigate to="/giang-day" replace />;
  }

  if (!hasConsoleAccess) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/40 px-4">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-soft">
          <h1 className="text-2xl font-bold">Chưa được cấp quyền</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tài khoản <strong>{userEmail}</strong> chưa được gán vai trò có quyền truy cập bảng điều hành.
            Nếu bạn là học viên, hãy vào Cổng học viên để xem lớp học, điểm danh và kết quả học tập.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => navigate({ to: "/hoc-vien", replace: true })}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Vào Cổng học viên
            </button>
            <button onClick={() => navigate({ to: "/", replace: true })} className="rounded-md border px-4 py-2 text-sm font-medium">
              Về trang chủ
            </button>
            <button onClick={signOut} className="rounded-md border px-4 py-2 text-sm font-medium">
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

    );
  }

  const required = requiredPermissionForPath(pathname);
  const routeAllowed = !required || can(required);
  const editPerm = editPermissionForPath(pathname);
  const readOnly = !!editPerm && !can(editPerm);


  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-white font-bold">K</div>
          <div className="font-bold">KAIZEN Admin</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
          <NavTree can={can} canAny={canAny} />
        </nav>

        <div className="shrink-0 border-t bg-card p-3">
          <div className="rounded-lg bg-muted p-3 text-xs">
            <div className="truncate font-semibold" title={userEmail}>{userEmail}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                title={(access?.roles ?? []).map(roleLabel).join(" · ")}
              >
                {(access?.roles ?? []).length} vai trò
              </span>
              <span
                className="rounded bg-muted-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                title={(access?.permissions ?? []).map((p) => PERMISSION_LABEL[p as Permission] ?? p).join(" · ")}
              >
                {(access?.permissions ?? []).length} quyền
              </span>
            </div>

            <div className="mt-2 flex flex-col gap-1.5">
              <PortalSwitcher current="admin" email={userEmail} onSignOut={signOut} />
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-white px-2 py-1.5 text-primary hover:bg-primary/5"
              >
                <Home className="h-3.5 w-3.5" /> Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-card px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Mở menu quản trị"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-md border text-foreground"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88vw] max-w-[20rem] p-0">
                <SheetHeader className="flex-row items-center gap-2 border-b p-4 text-left">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg gradient-brand font-bold text-white">K</div>
                  <SheetTitle className="text-base font-bold">KAIZEN Admin</SheetTitle>
                </SheetHeader>
                <nav className="h-[calc(100vh-8.5rem)] space-y-1 overflow-y-auto p-3 text-sm">
                  <NavTree can={can} canAny={canAny} onNavigate={() => setMobileNavOpen(false)} />
                </nav>
                <div className="border-t p-3 text-sm">
                  <div className="truncate text-xs font-semibold" title={userEmail}>{userEmail}</div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="truncate font-bold">KAIZEN Admin</div>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <WorkflowButton pathname={pathname} />
            <HelpButton pathname={pathname} />
            <NotificationBell />
            <div className="md:hidden">
              <PortalSwitcher current="admin" email={userEmail} onSignOut={signOut} compact />
            </div>
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2 py-1 text-xs font-medium text-primary md:hidden"
            >
              <Home className="h-3.5 w-3.5" /> Trang chủ
            </Link>
          </div>
        </header>

        <main className="w-full min-w-0 max-w-full p-4 md:p-8">
          {routeAllowed ? (
            readOnly ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <strong>Chế độ chỉ xem.</strong> Tài khoản của bạn chưa có quyền
                  “{PERMISSION_LABEL[editPerm!]}” nên các thao tác trên trang này đang bị khoá.
                </div>
                <fieldset disabled className="min-w-0 border-0 p-0 m-0">
                  <Outlet />
                </fieldset>
              </div>
            ) : (
              <Outlet />
            )
          ) : (
            <NoPermission permission={required!} />
          )}
        </main>
        {can("ai.assistant") && <AssistantPanel />}
      </div>
    </div>
  );
}

function HelpButton({ pathname }: { pathname: string }) {
  const guide = guideForPath(pathname);
  return guide ? (
    <Link
      to="/admin/huong-dan/$slug"
      params={{ slug: guide.slug }}
      className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
      title={`Hướng dẫn: ${guide.title}`}
    >
      <LifeBuoy className="h-4 w-4" /> <span className="hidden sm:inline">Hướng dẫn</span>
    </Link>
  ) : (
    <Link
      to="/admin/huong-dan"
      className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
    >
      <LifeBuoy className="h-4 w-4" /> <span className="hidden sm:inline">Hướng dẫn</span>
    </Link>
  );
}

function NoPermission({ permission }: { permission: Permission }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-soft">
      <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
      <h1 className="mt-3 text-xl font-bold">Không đủ quyền truy cập</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Mục này yêu cầu quyền <strong>{PERMISSION_LABEL[permission]}</strong>.
        Liên hệ quản trị viên để được cấp vai trò phù hợp.
      </p>
      <Link to="/admin" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Về Dashboard
      </Link>
    </div>
  );
}


type NavTone =
  | "red" | "amber" | "pink" | "blue" | "green"
  | "indigo" | "orange" | "slate" | "teal" | "violet" | "cyan";

const TONE_CLASS: Record<NavTone, string> = {
  red: "nav-tone-red",
  amber: "nav-tone-amber",
  pink: "nav-tone-pink",
  blue: "nav-tone-blue",
  green: "nav-tone-green",
  indigo: "nav-tone-indigo",
  orange: "nav-tone-orange",
  slate: "nav-tone-slate",
  teal: "nav-tone-teal",
  violet: "nav-tone-violet",
  cyan: "nav-tone-cyan",
};

function NavItem({ to, icon: Icon, tone = "slate", onNavigate, children }: { to: string; icon: any; tone?: NavTone; onNavigate?: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="group/nav relative flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm font-semibold leading-snug text-foreground/80 transition-colors hover:bg-muted hover:text-foreground md:py-2"
      activeProps={{ className: "nav-active bg-accent text-primary font-bold shadow-sm" }}
      activeOptions={{ exact: to === "/admin" }}
    >
      <span className={`nav-chip ${TONE_CLASS[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </Link>
  );
}

function NavGroup({ label, icon: Icon, paths, to, tone = "slate", children }: { label: string; icon: any; paths: string[]; to?: string; tone?: NavTone; children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const containsActive = paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const storageKey = `kz-nav-${label}`;
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved === null ? containsActive : saved === "1";
    } catch {
      return containsActive;
    }
  });
  useEffect(() => { if (containsActive) setOpen(true); }, [containsActive]);
  function toggle() {
    setOpen((v) => {
      const n = !v;
      try { window.localStorage.setItem(storageKey, n ? "1" : "0"); } catch {}
      return n;
    });
  }
  return (
    <div className="pt-2">
      <div className="group/navgroup flex w-full items-center rounded-md pr-1 text-sm font-bold leading-snug text-foreground hover:bg-muted">
        {to ? (
          <Link
            to={to}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2.5 py-2.5 md:py-2"
            activeProps={{ className: "nav-active text-primary" }}
          >
            <span className={`nav-chip ${TONE_CLASS[tone]}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 break-words">{label}</span>
          </Link>
        ) : (
          <button type="button" onClick={toggle} className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2.5 text-left md:py-2">
            <span className={`nav-chip ${TONE_CLASS[tone]}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 break-words">{label}</span>
          </button>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={open ? "Thu gọn" : "Mở rộng"}
          aria-expanded={open}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md hover:bg-background md:h-7 md:w-7"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
      </div>
      {open && <div className="mt-1 space-y-1 pl-2 border-l ml-3">{children}</div>}
    </div>
  );
}

type CanFn = (p: Permission) => boolean;
type CanAnyFn = (...p: Permission[]) => boolean;

function NavTree({ can, canAny, onNavigate }: { can: CanFn; canAny: CanAnyFn; onNavigate?: () => void }) {
  return (
    <>
      <NavItem to="/admin" icon={LayoutDashboard} tone="red" onNavigate={onNavigate}>Dashboard</NavItem>
      {can("leads.view") && <NavItem to="/admin/leads" icon={MessageSquare} tone="amber" onNavigate={onNavigate}>Khách hàng tiềm năng (Lead)</NavItem>}
      {(can("ctv.portal") || can("commissions.view") || can("report.view") || canAny("hr.view", "leave.approve", "payroll.view")) && (
        <NavGroup label="Quản trị nội bộ" icon={Building2} tone="slate" paths={["/admin/ctv","/admin/ca-nhan","/admin/nhan-su","/admin/hoa-hong","/admin/bao-cao"]}>
          {can("ctv.portal") && <NavItem to="/admin/ctv" icon={Users} tone="amber" onNavigate={onNavigate}>Cổng cộng tác viên</NavItem>}
          <NavItem to="/admin/ca-nhan" icon={Users} tone="slate" onNavigate={onNavigate}>Nhân sự của tôi</NavItem>
          {canAny("hr.view", "leave.approve", "payroll.view") && <NavItem to="/admin/nhan-su" icon={Users} tone="slate" onNavigate={onNavigate}>Quản trị nhân sự</NavItem>}
          {can("commissions.view") && <NavItem to="/admin/hoa-hong" icon={MessageSquare} tone="amber" onNavigate={onNavigate}>Hoa hồng cộng tác viên</NavItem>}
          {can("report.view") && <NavItem to="/admin/bao-cao" icon={BarChart3} tone="cyan" onNavigate={onNavigate}>Trung tâm báo cáo</NavItem>}
        </NavGroup>
      )}
      {can("marketing.campaigns") && <NavItem to="/admin/marketing/campaigns" icon={MessageSquare} tone="pink" onNavigate={onNavigate}>Chiến dịch marketing</NavItem>}

      {canAny("cms.view", "banners.manage", "popups.manage", "media.manage", "journey.manage") && (
        <NavGroup label="Nội dung website" icon={FolderOpen} tone="blue" paths={["/admin/cms","/admin/posts-hub","/admin/posts","/admin/logo","/admin/banners","/admin/page-banners","/admin/hot-programs","/admin/popups","/admin/hanh-trinh"]}>
          {can("cms.view") && <NavItem to="/admin/cms" icon={Layers} tone="blue" onNavigate={onNavigate}>CMS tập trung</NavItem>}
          {can("cms.view") && <NavItem to="/admin/posts-hub" icon={Layers} tone="blue" onNavigate={onNavigate}>Quản lý bài viết</NavItem>}
          {can("cms.view") && <NavItem to="/admin/posts" icon={FolderOpen} tone="blue" onNavigate={onNavigate}>Danh sách bài viết</NavItem>}
          {can("media.manage") && <NavItem to="/admin/cms/media" icon={Images} tone="blue" onNavigate={onNavigate}>Thư viện Media</NavItem>}
          {can("banners.manage") && <NavItem to="/admin/logo" icon={ImageIcon} tone="violet" onNavigate={onNavigate}>Logo website</NavItem>}
          {can("banners.manage") && <NavItem to="/admin/banners" icon={Images} tone="violet" onNavigate={onNavigate}>Banner trang chủ</NavItem>}
          {can("banners.manage") && <NavItem to="/admin/page-banners" icon={Images} tone="violet" onNavigate={onNavigate}>Banner các trang</NavItem>}
          {can("banners.manage") && <NavItem to="/admin/hot-programs" icon={Flame} tone="orange" onNavigate={onNavigate}>Chương trình hot</NavItem>}
          {can("popups.manage") && <NavItem to="/admin/popups" icon={Megaphone} tone="pink" onNavigate={onNavigate}>Popup trang chủ</NavItem>}
          {can("journey.manage") && <NavItem to="/admin/hanh-trinh" icon={MilestoneIcon} tone="teal" onNavigate={onNavigate}>Hành trình Kaizen</NavItem>}
        </NavGroup>
      )}

      {canAny("operations.overview", "students.view", "students.archive", "audit.view", "visa.view", "departure.view", "workflow.view", "training.view", "classes.view", "schedule.view", "oversight.view", "training.analytics", "teachers.view", "catalog.view", "lessons.view", "materials.view", "quizzes.view", "certificates.view", "operations.view", "system.diagnostics") && (
        <NavGroup label="Vận hành & Đào tạo" icon={Cog} tone="green" to="/admin/van-hanh" paths={["/admin/van-hanh","/admin/workflow","/admin/training","/admin/training/analytics","/admin/students","/admin/visa","/admin/xuat-canh","/admin/luu-tru","/admin/tra-soat","/admin/operations","/admin/teachers","/admin/catalog","/admin/lessons","/admin/materials","/admin/quizzes","/admin/certificates","/admin/kiem-nghiem"]}>
          {can("operations.overview") && <NavItem to="/admin/van-hanh" icon={LayoutDashboard} tone="green" onNavigate={onNavigate}>Tổng quan khối</NavItem>}

          {canAny("students.view", "students.archive") && (
            <NavGroup label="Quản lý học viên" icon={IdCard} tone="green" paths={["/admin/students","/admin/luu-tru"]}>
              {can("students.view") && <NavItem to="/admin/students" icon={IdCard} tone="green" onNavigate={onNavigate}>Hồ sơ học viên</NavItem>}
              {can("students.archive") && <NavItem to="/admin/luu-tru" icon={IdCard} tone="amber" onNavigate={onNavigate}>Kho lưu trữ hồ sơ</NavItem>}
            </NavGroup>
          )}

          {canAny("training.view", "oversight.view", "teachers.view", "materials.view", "quizzes.view", "certificates.view") && (
            <NavGroup label="Quản lý đào tạo" icon={School} tone="green" paths={["/admin/training","/admin/teachers","/admin/materials","/admin/quizzes","/admin/certificates"]}>
              {can("teachers.view") && <NavItem to="/admin/teachers" icon={UserCog} tone="blue" onNavigate={onNavigate}>Giáo viên</NavItem>}
              {can("materials.view") && <NavItem to="/admin/materials" icon={Folder} tone="amber" onNavigate={onNavigate}>Tài liệu học tập</NavItem>}
              {can("training.view") && <NavItem to="/admin/training" icon={School} tone="green" onNavigate={onNavigate}>Chương trình</NavItem>}
              {can("oversight.view") && <NavItem to="/admin/training/oversight" icon={School} tone="green" onNavigate={onNavigate}>Giám sát lớp học</NavItem>}
              {can("quizzes.view") && <NavItem to="/admin/quizzes" icon={ClipboardCheck} tone="violet" onNavigate={onNavigate}>Bài kiểm tra</NavItem>}
              {can("certificates.view") && <NavItem to="/admin/certificates" icon={Award} tone="orange" onNavigate={onNavigate}>Chứng chỉ</NavItem>}
            </NavGroup>
          )}

          {/* Tra soát trách nhiệm chỉ hiển thị trong hồ sơ/lịch sử lưu vết học viên.
              Route và quyền audit.view vẫn được giữ để không ảnh hưởng dữ liệu hiện có. */}
          {/* Ẩn khỏi menu: "Thống kê visa" và "Thống kê đào tạo" — xem trực tiếp trong Tổng quan khối.
              Đường dẫn /admin/visa và /admin/training/analytics vẫn hoạt động và giữ nguyên phân quyền. */}
          {can("departure.view") && <NavItem to="/admin/xuat-canh" icon={Plane} tone="indigo" onNavigate={onNavigate}>Quản lý xuất cảnh</NavItem>}
          {/* Workflow (18 bước): chạy ngầm — không hiển thị trên menu, route /admin/workflow vẫn hoạt động */}
          {can("catalog.view") && <NavItem to="/admin/catalog" icon={School} tone="slate" onNavigate={onNavigate}>Danh mục hệ thống</NavItem>}
          {/* "Bài học" (lessons) đã gộp vào E-learning → ẩn menu, tránh trùng module */}
          {can("operations.view") && <NavItem to="/admin/operations" icon={AlertTriangle} tone="red" onNavigate={onNavigate}>SLA & Cấp tài khoản</NavItem>}
          {can("system.diagnostics") && <NavItem to="/admin/kiem-nghiem" icon={ShieldCheck} tone="green" onNavigate={onNavigate}>Kiểm nghiệm & Bàn giao</NavItem>}

        </NavGroup>
      )}


      {can("chatbot.view") && (
        <NavGroup label="Chatbot" icon={Bot} tone="indigo" paths={["/admin/chatbot"]}>
          <NavItem to="/admin/chatbot" icon={Bot} tone="indigo" onNavigate={onNavigate}>Tổng quan</NavItem>
          <NavItem to="/admin/chatbot/knowledge" icon={BookOpen} tone="blue" onNavigate={onNavigate}>Tri thức</NavItem>
          <NavItem to="/admin/chatbot/prompt" icon={Sparkles} tone="violet" onNavigate={onNavigate}>System prompt</NavItem>
          <NavItem to="/admin/chatbot/training" icon={GraduationCap} tone="teal" onNavigate={onNavigate}>Huấn luyện</NavItem>
        </NavGroup>
      )}

      {canAny("courses.view", "courses.manage", "courses.orders") && (
        <NavGroup label="E-learning" icon={PlayCircle} tone="orange" paths={["/admin/courses","/admin/courses/orders"]}>
          {can("courses.view") && <NavItem to="/admin/courses" icon={PlayCircle} tone="orange" onNavigate={onNavigate}>Khoá học online</NavItem>}
          {can("courses.orders") && <NavItem to="/admin/courses/orders" icon={ShoppingCart} tone="amber" onNavigate={onNavigate}>Đơn hàng khoá học</NavItem>}
        </NavGroup>
      )}

      {canAny("users.manage", "settings.manage", "settings.payments", "settings.emails", "notifications.manage", "ai.settings") && (
        <NavGroup label="Hệ thống" icon={SettingsIcon} tone="slate" paths={["/admin/users","/admin/settings/payments","/admin/settings/emails","/admin/telegram","/admin/cai-dat-ai"]}>
          {can("users.manage") && <NavItem to="/admin/users" icon={Users} tone="slate" onNavigate={onNavigate}>Tài khoản & Quyền</NavItem>}
          {can("settings.payments") && <NavItem to="/admin/settings/payments" icon={Cog} tone="green" onNavigate={onNavigate}>Cài đặt thanh toán</NavItem>}
          {can("settings.emails") && <NavItem to="/admin/settings/emails" icon={Cog} tone="blue" onNavigate={onNavigate}>Tuỳ chỉnh email</NavItem>}
          {can("notifications.manage") && <NavItem to="/admin/telegram" icon={Cog} tone="cyan" onNavigate={onNavigate}>Cảnh báo Telegram</NavItem>}
          {can("ai.settings") && <NavItem to="/admin/cai-dat-ai" icon={ShieldCheck} tone="green" onNavigate={onNavigate}>Cài đặt AI</NavItem>}
        </NavGroup>
      )}

      <div className="mt-2 border-t pt-2">
        <NavItem to="/admin/huong-dan" icon={LifeBuoy} tone="teal" onNavigate={onNavigate}>Hướng dẫn sử dụng</NavItem>
      </div>
    </>
  );
}

function WorkflowButton({ pathname }: { pathname: string }) {
  const wf = workflowForPath(pathname);
  if (!wf) return null;
  return (
    <Link
      to="/admin/huong-dan/quy-trinh/$slug"
      params={{ slug: wf.slug }}
      className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
      title={`Quy trình: ${wf.title}`}
    >
      <ListChecks className="h-4 w-4" /> <span className="hidden sm:inline">Xem quy trình</span>
    </Link>
  );
}
