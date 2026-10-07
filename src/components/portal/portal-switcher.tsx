import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Check,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMyAccess } from "@/lib/rbac/use-access";
import { isPortalStaff, roleLabel } from "@/lib/rbac/catalog";
import { canUseAdminConsole } from "@/lib/rbac/portal";

export type PortalKind = "admin" | "teacher" | "student";

export function PortalSwitcher({
  current,
  email,
  onSignOut,
  compact = false,
}: {
  current: PortalKind;
  email: string;
  onSignOut: () => void | Promise<void>;
  compact?: boolean;
}) {
  const { access } = useMyAccess();
  const roles = access?.roles ?? [];
  const isAdmin = access?.isAdmin ?? false;
  const canOpenAdmin = canUseAdminConsole(roles, access?.permissions?.length ?? 0);
  const canOpenTeacher = roles.includes("teacher") || isPortalStaff(roles);
  const canOpenStudent = roles.includes("student");
  const currentLabel = current === "admin" ? "Cổng quản trị" : current === "teacher" ? "Cổng giáo viên" : "Cổng học viên";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "icon" : "sm"}
          className={compact ? "h-10 w-10" : "w-full justify-between bg-background"}
          aria-label="Mở menu tài khoản và chuyển cổng"
        >
          <UserRound className="h-4 w-4" />
          {!compact && <span className="min-w-0 flex-1 truncate text-left">{currentLabel}</span>}
          {!compact && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-1rem))]">
        <DropdownMenuLabel className="space-y-1">
          <span className="block truncate">{email || "Tài khoản Kaizen"}</span>
          <span className="block text-xs font-normal text-muted-foreground">
            {roles.length > 0 ? roles.map(roleLabel).join(" · ") : "Đang tải vai trò"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canOpenAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="cursor-pointer">
              <LayoutDashboard /> Cổng quản trị {current === "admin" && <Check className="ml-auto" />}
            </Link>
          </DropdownMenuItem>
        )}
        {canOpenTeacher && (
          <DropdownMenuItem asChild>
            <Link to="/giang-day" search={{}} className="cursor-pointer">
              <BookOpen /> Cổng giáo viên {current === "teacher" && <Check className="ml-auto" />}
            </Link>
          </DropdownMenuItem>
        )}
        {canOpenStudent && (
          <DropdownMenuItem asChild>
            <Link to="/hoc-vien" search={{}} className="cursor-pointer">
              <GraduationCap /> Cổng học viên {current === "student" && <Check className="ml-auto" />}
            </Link>
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Xem thử bằng dữ liệu mẫu</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/giang-day" search={{ preview: "teacher" }} className="cursor-pointer">
                <ShieldCheck /> Xem thử vai trò Giáo viên
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/hoc-vien" search={{ preview: "student" }} className="cursor-pointer">
                <ShieldCheck /> Xem thử vai trò Học viên
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void onSignOut()} className="cursor-pointer text-primary">
          <LogOut /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PortalPreview({ kind }: { kind: "teacher" | "student" }) {
  const teacher = kind === "teacher";
  const stats = teacher
    ? [["Lớp phụ trách", "4"], ["Buổi hôm nay", "3"], ["Cần điểm danh", "1"]]
    : [["Lớp đang học", "2"], ["Tiến trình hồ sơ", "72%"], ["Tài liệu đã nộp", "8"]];
  const rows = teacher
    ? ["Tiếng Đức B1 · 08:00–10:00", "Định hướng nghề nghiệp · 13:30–15:00", "Tiếng Đức A2 · 15:30–17:30"]
    : ["Tiếng Đức B1 · Đang học", "Định hướng trước xuất cảnh · Sắp bắt đầu"];

  return (
    <div className="space-y-6" aria-label={`Bản xem thử cổng ${teacher ? "giáo viên" : "học viên"}`}>
      <div>
        <p className="text-sm font-semibold text-primary">Dữ liệu minh họa tổng hợp</p>
        <h1 className="text-2xl font-bold">{teacher ? "Tổng quan giảng dạy" : "Xin chào, Học viên mẫu"}</h1>
        <p className="text-sm text-muted-foreground">
          {teacher ? "Lớp phụ trách, lịch dạy và công việc cần hoàn tất." : "Theo dõi hành trình học tập và tiến độ hồ sơ tại Kaizen."}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          {teacher ? <BookOpen className="h-5 w-5 text-primary" /> : <GraduationCap className="h-5 w-5 text-primary" />}
          <h2 className="font-semibold">{teacher ? "Lịch hôm nay" : "Lớp học gần đây"}</h2>
        </div>
        <div className="mt-3 divide-y">
          {rows.map((row) => <div key={row} className="py-3 text-sm font-medium">{row}</div>)}
        </div>
      </section>
    </div>
  );
}