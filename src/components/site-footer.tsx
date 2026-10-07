import { Link } from "@tanstack/react-router";
import {
  Phone,
  Mail,
  MapPin,
  ArrowUpRight,
  Facebook,
  MessageCircle,
  Map as MapIcon,
  Clock,
  Youtube,
} from "lucide-react";
import { SiteLogo } from "@/components/site-logo";
import { COMPANY } from "@/lib/markets";

// Feature flag — bật khi có xác nhận của Bộ Công Thương
const BCT_APPROVED = false;
const BCT_URL = "http://online.gov.vn/";

const SITEMAP = [
  { label: "Trang chủ", to: "/" },
  { label: "Về Kaizen", to: "/ve-kaizen" },
  { label: "Founder & CEO", to: "/ve-kaizen/founder" },
  { label: "Hành trình thành công", to: "/ve-kaizen/hanh-trinh" },
  { label: "Tin tức", to: "/tin-tuc" },
  { label: "Đối tác quốc tế", to: "/doi-tac" },
];

const SERVICES = [
  { label: "Du học quốc tế", to: "/du-hoc" },
  { label: "Xuất khẩu lao động", to: "/xkld" },
  { label: "Đào tạo ngoại ngữ", to: "/ngoai-ngu" },
  { label: "Du lịch & Visa", to: "/du-lich-visa" },
  { label: "Outsourcing", to: "/outsourcing" },
];

const SUPPORT = [
  { label: "Giấy phép & Pháp lý", to: "/ve-kaizen/phap-ly" },
  { label: "Chính sách bảo mật", to: "/chinh-sach-bao-mat" },
  { label: "Điều khoản sử dụng", to: "/dieu-khoan" },
  { label: "Liên hệ", to: "/lien-he" },
];

function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M16.5 5.5a4.5 4.5 0 0 0 4.5 4.5v3a7.5 7.5 0 0 1-4.5-1.5v6.25a5.75 5.75 0 1 1-5.75-5.75c.34 0 .68.03 1 .09v3.16a2.6 2.6 0 1 0 1.75 2.5V3h3v2.5z" />
    </svg>
  );
}

export function SiteFooter() {
  const { facebook, tiktok, youtube, zalo } = COMPANY.social;
  const year = new Date().getFullYear();

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.name,
    alternateName: COMPANY.short,
    url: "https://kaizenmanpower.com",
    logo: "https://kaizenmanpower.com/logo.png",
    telephone: COMPANY.phone,
    email: COMPANY.email,
    taxID: COMPANY.taxId,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address,
      addressLocality: "Nghệ An",
      addressCountry: "VN",
    },
    sameAs: [facebook, tiktok, zalo].filter(Boolean),
  };

  return (
    <footer role="contentinfo" className="relative overflow-hidden bg-[#0B0F19] text-gray-300">
      {/* Hairline brand accent */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="container mx-auto px-4 pt-16 pb-12 md:pt-20 md:pb-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* COL 1 — Brand */}
          <div className="lg:col-span-4">
            <Link to="/" aria-label="Kaizen — trang chủ" className="inline-block">
              <SiteLogo size={58} variant="light" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-gray-300">
              Kết nối tài năng Việt Nam với cơ hội toàn cầu — Du học, Xuất khẩu
              lao động, Ngoại ngữ và Tư vấn doanh nghiệp.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${COMPANY.phoneRaw}`}
                  className="group flex items-center gap-3 text-gray-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] rounded-md"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 transition-colors group-hover:bg-primary/20 group-hover:ring-primary/30">
                    <Phone className="h-4 w-4 text-primary" />
                  </span>
                  <span className="font-semibold tracking-wide">{COMPANY.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="group flex items-center gap-3 text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] rounded-md"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 transition-colors group-hover:bg-primary/20 group-hover:ring-primary/30">
                    <Mail className="h-4 w-4 text-primary" />
                  </span>
                  <span className="break-all">{COMPANY.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={COMPANY.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] rounded-md"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 transition-colors group-hover:bg-primary/20 group-hover:ring-primary/30">
                    <MapPin className="h-4 w-4 text-primary" />
                  </span>
                  <span className="min-w-0 leading-relaxed">{COMPANY.address}</span>
                </a>
              </li>
            </ul>

            <div className="mt-6 flex items-center gap-2.5">
              <SocialBtn href={facebook} label="Facebook Kaizen">
                <Facebook className="h-4 w-4" />
              </SocialBtn>
              <SocialBtn href={tiktok} label="TikTok Kaizen">
                <TikTokIcon className="h-4 w-4" />
              </SocialBtn>
              <SocialBtn href={youtube} label="YouTube Kaizen">
                <Youtube className="h-4 w-4" />
              </SocialBtn>
              <SocialBtn href={zalo} label="Chat Zalo Kaizen">
                <MessageCircle className="h-4 w-4" />
              </SocialBtn>
              <SocialBtn href={COMPANY.mapsUrl} label="Xem trên Google Maps">
                <MapIcon className="h-4 w-4" />
              </SocialBtn>
            </div>

            <Link
              to="/dang-ky"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#e23a40] px-6 text-sm font-semibold text-white shadow-[0_10px_28px_-10px_rgba(201,32,38,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_rgba(201,32,38,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] motion-reduce:transform-none motion-reduce:transition-none"
            >
              Đăng ký tư vấn
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <p className="mt-5 text-xs text-gray-400">
              Mã số doanh nghiệp: <span className="font-medium text-gray-300">{COMPANY.taxId}</span>
            </p>
          </div>

          {/* COL 2 — Sitemap */}
          <nav aria-label="Sitemap" className="lg:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
              Sitemap
            </h4>
            <ul className="mt-6 space-y-3">
              {SITEMAP.map((l) => (
                <li key={l.label}>
                  <FooterLink to={l.to}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* COL 3 — Dịch vụ */}
          <nav aria-label="Dịch vụ Kaizen" className="lg:col-span-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
              Dịch vụ
            </h4>
            <ul className="mt-6 space-y-3">
              {SERVICES.map((l) => (
                <li key={l.label}>
                  <FooterLink to={l.to}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* COL 4 — Hỗ trợ & Pháp lý */}
          <nav aria-label="Hỗ trợ và pháp lý" className="lg:col-span-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
              Hỗ trợ & Pháp lý
            </h4>
            <ul className="mt-6 space-y-3">
              {SUPPORT.map((l) => (
                <li key={l.label}>
                  <FooterLink to={l.to}>{l.label}</FooterLink>
                </li>
              ))}
              <li>
                <a
                  href={COMPANY.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:underline"
                >
                  Google Maps
                </a>
              </li>
            </ul>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Giờ làm việc
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-300">
                {COMPANY.hours.weekday}
                <br />
                {COMPANY.hours.sunday}
              </p>
            </div>
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-6 text-xs text-gray-400 md:flex-row md:items-center md:justify-between">
          <div className="leading-relaxed">
            © {year} <span className="font-semibold text-gray-300">{COMPANY.short}</span>. Mọi quyền được bảo lưu.
          </div>

          {/* Slot Bộ Công Thương — hiển thị khi được xác nhận */}
          {BCT_APPROVED && (
            <a
              href={BCT_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Đã thông báo Bộ Công Thương"
              className="inline-flex items-center transition-opacity hover:opacity-90"
            >
              <img
                src="/bct-logo.png"
                alt="Đã thông báo Bộ Công Thương"
                width={140}
                height={52}
                loading="lazy"
                decoding="async"
              />
            </a>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/chinh-sach-bao-mat" className="hover:text-gray-200 focus-visible:outline-none focus-visible:underline">
              Chính sách bảo mật
            </Link>
            <Link to="/dieu-khoan" className="hover:text-gray-200 focus-visible:outline-none focus-visible:underline">
              Điều khoản sử dụng
            </Link>
            <Link
              to="/auth"
              className="text-gray-500 transition-colors hover:text-gray-300 focus-visible:outline-none focus-visible:underline"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-sm text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:underline"
    >
      {children}
    </Link>
  );
}

function SocialBtn({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: React.ReactNode;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="me noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-gray-200 ring-1 ring-white/10 transition-all duration-200 hover:scale-105 hover:bg-white/10 hover:text-white hover:ring-white/25 hover:shadow-[0_6px_18px_-6px_rgba(255,255,255,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] motion-reduce:transform-none motion-reduce:transition-none"
    >
      {children}
    </a>
  );
}
