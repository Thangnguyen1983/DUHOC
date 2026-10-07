import { Link } from "@tanstack/react-router";
import { Phone, Menu, X, ChevronDown, ChevronRight, Mail, GraduationCap, Briefcase, Globe2, Languages, Building2, User, LogIn, UserPlus, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { COMPANY } from "@/lib/markets";
import { Button } from "@/components/ui/button";
import { SiteLogo } from "@/components/site-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { supabase } from "@/integrations/supabase/client";

type SubItem = {
  label: string;
  to?: string;
  params?: Record<string, string>;
  desc?: string;
  flag?: string;
  icon?: React.ReactNode;
  children?: SubItem[];
};
type MenuItem = {
  label: string;
  to?: string;
  params?: Record<string, string>;
  children?: SubItem[];
  columns?: 1 | 2;
};





const MENU: MenuItem[] = [
  { label: "Trang chủ", to: "/" },
  {
    label: "Về Kaizen",
    to: "/ve-kaizen",
    children: [
      { label: "Tổng quan Kaizen", to: "/ve-kaizen", desc: "Sứ mệnh, tầm nhìn, giá trị cốt lõi" },
      { label: "Founder & CEO", to: "/ve-kaizen/founder", desc: "Trịnh Thị Huyên — Người sáng lập" },
      { label: "Giấy phép & Pháp lý", to: "/ve-kaizen/phap-ly", desc: "Hồ sơ pháp lý minh bạch" },
      { label: "Hành trình thành công", to: "/ve-kaizen/hanh-trinh", desc: "15 năm — 5.000+ học viên" },
      { label: "Thư viện hình ảnh & video", to: "/ve-kaizen/thu-vien", desc: "Khoảnh khắc Kaizen" },
    ],
  },
  {
    label: "Nhân lực",
    to: "/xkld",
    columns: 2,
    children: [
      { label: "Xuất khẩu lao động", to: "/xkld", desc: "Đơn hàng, visa, phái cử", icon: <Briefcase className="h-4 w-4" /> },
      { label: "Nhật Bản", flag: "🇯🇵", to: "/xkld/$country", params: { country: "nhat-ban" } },
      { label: "Hàn Quốc", flag: "🇰🇷", to: "/xkld/$country", params: { country: "han-quoc" } },
      { label: "Đài Loan", flag: "🇹🇼", to: "/xkld/$country", params: { country: "dai-loan" } },
      { label: "CHLB Đức", flag: "🇩🇪", to: "/xkld/$country", params: { country: "duc" } },
      { label: "Hungary", flag: "🇭🇺", to: "/xkld/$country", params: { country: "hungary" } },
      { label: "Ba Lan", flag: "🇵🇱", to: "/xkld/$country", params: { country: "ba-lan" } },
      { label: "Romania", flag: "🇷🇴", to: "/xkld/$country", params: { country: "romania" } },
      { label: "Slovakia", flag: "🇸🇰", to: "/xkld/$country", params: { country: "slovakia" } },
      { label: "Latvia", flag: "🇱🇻", to: "/xkld/$country", params: { country: "latvia" } },
      { label: "Bulgaria", flag: "🇧🇬", to: "/xkld/$country", params: { country: "bulgaria" } },
    ],
  },
  {
    label: "Du học",
    to: "/du-hoc",
    columns: 2,
    children: [
      { label: "Du học quốc tế", to: "/du-hoc", desc: "Tổng quan 8 quốc gia", icon: <GraduationCap className="h-4 w-4" /> },
      { label: "Hàn Quốc", flag: "🇰🇷", to: "/du-hoc/$country", params: { country: "han-quoc" } },
      { label: "Đài Loan", flag: "🇹🇼", to: "/du-hoc/$country", params: { country: "dai-loan" } },
      { label: "Nhật Bản", flag: "🇯🇵", to: "/du-hoc/$country", params: { country: "nhat-ban" } },
      { label: "CHLB Đức", flag: "🇩🇪", to: "/du-hoc/$country", params: { country: "duc" } },
      { label: "Canada", flag: "🇨🇦", to: "/du-hoc/$country", params: { country: "canada" } },
      { label: "Úc", flag: "🇦🇺", to: "/du-hoc/$country", params: { country: "uc" } },
      { label: "Anh Quốc", flag: "🇬🇧", to: "/du-hoc/$country", params: { country: "anh" } },
      { label: "Mỹ", flag: "🇺🇸", to: "/du-hoc/$country", params: { country: "my" } },
    ],
  },
  {
    label: "Ngoại ngữ",
    to: "/ngoai-ngu",
    columns: 2,
    children: [
      { label: "Đào tạo ngoại ngữ", to: "/ngoai-ngu", desc: "Tổng quan 5 thứ tiếng", icon: <Languages className="h-4 w-4" /> },
      { label: "Tiếng Trung", flag: "🇨🇳", to: "/ngoai-ngu/$lang", params: { lang: "tieng-trung" } },
      { label: "Tiếng Hàn", flag: "🇰🇷", to: "/ngoai-ngu/$lang", params: { lang: "tieng-han" } },
      { label: "Tiếng Nhật", flag: "🇯🇵", to: "/ngoai-ngu/$lang", params: { lang: "tieng-nhat" } },
      { label: "Tiếng Đức", flag: "🇩🇪", to: "/ngoai-ngu/$lang", params: { lang: "tieng-duc" } },
      { label: "Tiếng Anh", flag: "🇬🇧", to: "/ngoai-ngu/$lang", params: { lang: "tieng-anh" } },
      { label: "Khoá học online", to: "/khoa-hoc", desc: "E-learning — học mọi lúc", icon: <Languages className="h-4 w-4" /> },
    ],
  },
  {
    label: "Doanh nghiệp",
    to: "/doi-tac",
    children: [
      { label: "Đối tác chiến lược", to: "/doi-tac", desc: "Mạng lưới toàn cầu", icon: <Globe2 className="h-4 w-4" /> },
      { label: "Trường đối tác", to: "/doi-tac/truong", desc: "Danh sách trường đại học – học viện", icon: <Building2 className="h-4 w-4" /> },
      { label: "Outsourcing", to: "/outsourcing", desc: "Cung ứng nhân sự cho doanh nghiệp", icon: <Building2 className="h-4 w-4" /> },
      { label: "Liên hệ hợp tác", to: "/lien-he", desc: "Gặp đội ngũ Kaizen", icon: <Mail className="h-4 w-4" /> },
    ],
  },
  { label: "Câu chuyện HV", to: "/cau-chuyen" },
  { label: "Tin tức", to: "/tin-tuc" },
  { label: "Liên hệ", to: "/lien-he" },

];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [nestedExpanded, setNestedExpanded] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white transition-all duration-300 ${
        scrolled
          ? "shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)] backdrop-blur-md bg-white/95"
          : "shadow-[0_1px_0_0_rgba(15,23,42,0.06)]"
      }`}
    >
      {/* Top utility bar */}
      <div className="hidden border-b border-white/10 bg-[#3F7D3A] lg:block">
        <div className="container mx-auto flex h-9 items-center justify-between px-4 text-[12px] text-white/90">
          <div className="flex items-center gap-5">
            <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-1.5 transition-colors hover:text-white">
              <Mail className="h-3 w-3 text-white" /> {COMPANY.email}
            </a>
            <span className="hidden h-3 w-px bg-white/25 xl:block" />
            <span className="hidden italic text-white/80 xl:inline">{COMPANY.slogan}</span>
          </div>
          <div className="flex items-center gap-3">
            {userEmail ? (
              <>
                <Link
                  to="/hoc-vien"
                  className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-white transition hover:bg-white/25"
                >
                  <User className="h-3 w-3" />
                  <span className="max-w-[140px] truncate">{userEmail}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-white/90 transition hover:text-white"
                >
                  <LogOut className="h-3 w-3" /> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  search={{ mode: "login" } as never}
                  className="flex items-center gap-1 text-white/95 transition hover:text-white"
                >
                  <LogIn className="h-3 w-3" /> Đăng nhập
                </Link>
                <span className="h-3 w-px bg-white/25" />
                <Link
                  to="/auth"
                  search={{ mode: "signup" } as never}
                  className="flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-0.5 font-medium text-white transition hover:bg-primary"
                >
                  <UserPlus className="h-3 w-3" /> Đăng ký
                </Link>
              </>
            )}
            <span className="h-3 w-px bg-white/25" />
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              <span className="text-white/85">Tư vấn 24/7</span>
            </span>
            <span className="h-3 w-px bg-white/25" />
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main bar */}
       <div className={`container mx-auto flex items-center justify-between gap-2 px-4 transition-all duration-300 lg:gap-6 ${scrolled ? "h-16 lg:h-[68px]" : "h-16 lg:h-[84px]"}`}>
        <Link to="/" className="group flex shrink-0 items-center" aria-label="Kaizen Global">
            <SiteLogo size={48} className="transition-all duration-300 max-lg:!inline-flex lg:!hidden" />
            <SiteLogo size={scrolled ? 48 : 56} className="!hidden transition-all duration-300 lg:!inline-flex" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
          {MENU.map((item) => (
            <DesktopMenuItem key={item.label} item={item} />
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {/* Hotline */}
          <a
            href={`tel:${COMPANY.phoneRaw}`}
            className="group flex items-center gap-2.5 rounded-full border border-border/70 bg-white px-3.5 py-1.5 transition-all hover:border-primary/40 hover:shadow-[0_4px_14px_-4px_rgba(201,32,38,0.25)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#e23a40] text-white shadow-[0_4px_12px_-3px_rgba(201,32,38,0.55)]">
              <Phone className="h-4 w-4" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Hotline
              </span>
              <span className="text-[14px] font-bold text-foreground group-hover:text-primary">
                {COMPANY.phone}
              </span>
            </span>
          </a>
          <Button
            asChild
            size="sm"
            className="h-11 rounded-full bg-gradient-to-r from-primary to-[#e23a40] px-5 text-[13px] font-semibold tracking-wide text-white shadow-[0_8px_22px_-8px_rgba(201,32,38,0.65)] transition-all hover:translate-y-[-1px] hover:opacity-95 hover:shadow-[0_12px_26px_-8px_rgba(201,32,38,0.7)]"
          >
            <Link to="/dang-ky">Đăng ký tư vấn</Link>
          </Button>
        </div>

        {/* Mobile controls */}
         <div className="flex shrink-0 items-center gap-1 lg:hidden">
          <a
            href={`tel:${COMPANY.phoneRaw}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#e23a40] text-white shadow-[0_4px_12px_-3px_rgba(201,32,38,0.55)]"
            aria-label="Gọi hotline"
          >
            <Phone className="h-4 w-4" />
          </a>
          <LanguageSwitcher compact />
          <button
            type="button"
            className="rounded-lg p-2 text-foreground/80 hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Đóng menu chính" : "Mở menu chính"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-border/60 bg-white lg:hidden">
          <div className="container mx-auto flex flex-col px-4 py-3">
            {MENU.map((item) => {
              if (!item.children) {
                return (
                  <Link
                    key={item.label}
                    to={item.to!}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-[15px] font-semibold text-foreground hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                );
              }
              const isOpen = expanded === item.label;
              return (
                <div key={item.label} className="border-b border-border/40 last:border-0">
                  <div className="flex items-center rounded-lg text-[15px] font-semibold text-foreground hover:bg-muted">
                    <Link to={item.to!} onClick={() => setOpen(false)} className="min-w-0 flex-1 px-3 py-3">{item.label}</Link>
                    <button
                      type="button"
                      aria-label={`${isOpen ? "Thu gọn" : "Mở rộng"} ${item.label}`}
                      aria-expanded={isOpen}
                      onClick={() => { setExpanded(isOpen ? null : item.label); setNestedExpanded(null); }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="flex flex-col gap-0.5 pb-2 pl-3">
                      {item.children.map((c) => {
                        if (c.children) {
                          const nestedOpen = nestedExpanded === c.label;
                          return (
                            <div key={c.label}>
                              <button
                                onClick={() => setNestedExpanded(nestedOpen ? null : c.label)}
                                 className="flex min-h-11 w-full items-center justify-between rounded-md px-3 py-3 text-[14px] text-foreground/75 hover:bg-muted hover:text-primary"
                              >
                                <span className="flex items-center gap-2">
                                  {c.flag && <span>{c.flag}</span>}
                                  {c.icon}
                                  <span>{c.label}</span>
                                </span>
                                <ChevronDown
                                  className={`h-3.5 w-3.5 transition-transform ${nestedOpen ? "rotate-180 text-primary" : "text-muted-foreground"}`}
                                />
                              </button>
                              {nestedOpen && (
                                <div className="flex flex-col gap-0.5 pl-4">
                                  {c.children.map((nc) => (
                                    <Link
                                      key={nc.label}
                                      to={nc.to as any}
                                      params={nc.params as any}
                                      onClick={() => setOpen(false)}
                                       className="flex min-h-11 items-center gap-2 rounded-md px-3 py-3 text-[13px] text-foreground/70 hover:bg-muted hover:text-primary"
                                    >
                                      {nc.flag && <span>{nc.flag}</span>}
                                      <span>{nc.label}</span>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <Link
                            key={c.label}
                            to={c.to as any}
                            params={c.params as any}
                            onClick={() => setOpen(false)}
                             className="flex min-h-11 items-center gap-2 rounded-md px-3 py-3 text-[14px] text-foreground/75 hover:bg-muted hover:text-primary"
                          >
                            {c.flag && <span>{c.flag}</span>}
                            {c.icon}
                            <span>{c.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <Button
              asChild
              className="mt-4 h-11 rounded-full bg-gradient-to-r from-primary to-[#e23a40] font-semibold text-white"
            >
              <Link to="/dang-ky" onClick={() => setOpen(false)}>
                Đăng ký tư vấn
              </Link>
            </Button>
            <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3 text-[12px] text-muted-foreground">
              <a href={`tel:${COMPANY.phoneRaw}`} className="flex items-center gap-1.5 font-medium text-primary">
                <Phone className="h-3.5 w-3.5" /> {COMPANY.phone}
              </a>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function DesktopMenuItem({ item }: { item: MenuItem }) {
  if (!item.children) {
    return (
      <Link
        to={item.to!}
        className="group relative rounded-md px-3 py-2 text-[13.5px] font-medium text-foreground/75 transition-colors hover:text-primary"
        activeProps={{ className: "text-primary" }}
      >
        {item.label}
        <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-primary to-[#3F7D3A] transition-transform duration-300 group-hover:scale-x-100" />
      </Link>
    );
  }
  const cols = item.columns ?? 1;
  const hasNested = item.children.some((c) => c.children);
  const widthClass = hasNested
    ? "w-[640px]"
    : cols === 2
      ? "w-[520px]"
      : "w-[300px]";
  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-[13.5px] font-medium text-foreground/75 transition-colors hover:text-primary"
      >
        {item.label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180 group-hover:text-primary" />
      </button>
      <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-primary to-[#3F7D3A] transition-transform duration-300 group-hover:scale-x-100" />

      <div
        className={`pointer-events-none invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 ${widthClass}`}
      >
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)]">
          <div className="h-1 w-full bg-gradient-to-r from-primary via-[#e23a40] to-[#3F7D3A]" />
          <div className={`grid gap-1 p-3 ${cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
            {item.children.map((c) => (
              <DesktopSubItem key={c.label} item={c} openLeft={item.label === "Ngoại ngữ" || item.label === "Doanh nghiệp"} />
            ))}
          </div>
          {item.to && (
            <Link
              to={item.to}
              className="flex items-center justify-between border-t border-border/50 bg-muted/40 px-5 py-2.5 text-[12px] font-semibold text-primary hover:bg-muted"
            >
              <span>Xem tất cả {item.label.toLowerCase()}</span>
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function DesktopSubItem({ item, openLeft = false }: { item: SubItem; openLeft?: boolean }) {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="group/sub relative">
      <Link
        to={item.to as any}
        params={item.params as any}
        className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gradient-to-br hover:from-primary/[0.06] hover:to-[#3F7D3A]/[0.06]"
      >
        {item.flag ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base group-hover/sub:bg-white">
            {item.flag}
          </span>
        ) : item.icon ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {item.icon}
          </span>
        ) : (
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40 group-hover/sub:bg-primary" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <div className="text-[13.5px] font-semibold text-foreground group-hover/sub:text-primary">
              {item.label}
            </div>
            {hasChildren && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover/sub:translate-x-0.5" />
            )}
          </div>
          {item.desc && (
            <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
              {item.desc}
            </div>
          )}
        </div>
      </Link>

      {hasChildren && (
         <div className={`pointer-events-none invisible absolute top-0 z-50 opacity-0 transition-all duration-200 group-hover/sub:pointer-events-auto group-hover/sub:visible group-hover/sub:opacity-100 ${openLeft ? "right-full pr-2 -translate-x-1 group-hover/sub:translate-x-0" : "left-full pl-2 translate-x-1 group-hover/sub:translate-x-0"}`}>
          <div className="w-[300px] overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)]">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-[#e23a40] to-[#3F7D3A]" />
            <div className="flex flex-col gap-0.5 p-3">
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Chọn quốc gia
              </div>
              {item.children!.map((nc) => (
                <Link
                  key={nc.label}
                  to={nc.to as any}
                  params={nc.params as any}
                  className="group/nested flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gradient-to-br hover:from-primary/[0.06] hover:to-[#3F7D3A]/[0.06]"
                >
                  {nc.flag && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base group-hover/nested:bg-white">
                      {nc.flag}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-foreground group-hover/nested:text-primary">
                      {nc.label}
                    </div>
                    {nc.desc && (
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {nc.desc}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
