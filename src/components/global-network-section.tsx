import { Network, MapPin } from "lucide-react";
import { Eyebrow } from "@/components/editorial";

const NETWORK_COUNTRIES = [
  { code: "DE", flag: "🇩🇪", name: "Đức", role: "Điều dưỡng & Kỹ sư", left: 52.9, top: 21.6 },
  { code: "UK", flag: "🇬🇧", name: "Anh Quốc", role: "Du học & Đào tạo", left: 49.4, top: 19.6 },
  { code: "US", flag: "🇺🇸", name: "Hoa Kỳ", role: "Du học & Định cư", left: 22.5, top: 30.0 },
  { code: "CA", flag: "🇨🇦", name: "Canada", role: "Du học & Định cư", left: 20.5, top: 18.8 },
  { code: "JP", flag: "🇯🇵", name: "Nhật Bản", role: "Du học & Kỹ năng đặc định", left: 88.4, top: 29.9 },
  { code: "KR", flag: "🇰🇷", name: "Hàn Quốc", role: "Du học & EPS", left: 85.5, top: 30.1 },
  { code: "TW", flag: "🇹🇼", name: "Đài Loan", role: "Du học & Lao động", left: 83.6, top: 36.8 },
  { code: "AU", flag: "🇦🇺", name: "Úc", role: "Du học & Định cư", left: 86.5, top: 72.5 },
] as const;

const HQ = { left: 80, top: 42.2 };

export function GlobalNetworkSection() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Mạng lưới toàn cầu</Eyebrow>
          <h2 className="serif-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            Global Network
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Kaizen kết nối tài năng Việt Nam với mạng lưới đối tác tại các quốc gia phát triển hàng đầu thế giới.
          </p>
        </div>

         <div className="mt-12 max-w-full overflow-x-auto border border-line bg-white shadow-soft" aria-label="Bản đồ mạng lưới quốc tế, vuốt ngang để xem đầy đủ">
          <div
             className="relative min-w-[700px] lg:min-w-0 lg:w-full"
            style={{
              aspectRatio: "2 / 1",
              backgroundImage: "radial-gradient(circle, oklch(0.88 0.02 240) 1px, transparent 1.2px)",
              backgroundSize: "18px 18px",
              backgroundPosition: "0 0",
            }}
          >
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 50" preserveAspectRatio="none">
              <defs>
                <linearGradient id="netLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#C92026" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#3F7D3A" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              {NETWORK_COUNTRIES.map((c) => {
                const x1 = HQ.left;
                const y1 = HQ.top / 2;
                const x2 = c.left;
                const y2 = c.top / 2;
                const cx = (x1 + x2) / 2;
                const cy = Math.min(y1, y2) - 6;
                return (
                  <path
                    key={c.code}
                    d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                    fill="none"
                    stroke="url(#netLine)"
                    strokeWidth="0.25"
                    strokeDasharray="0.6 0.6"
                  />
                );
              })}
            </svg>

            <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${HQ.left}%`, top: `${HQ.top}%` }}>
              <div className="relative">
                <span className="absolute inset-0 -m-2 animate-ping rounded-full bg-secondary/40" />
                <span className="relative grid h-4 w-4 place-items-center rounded-full bg-secondary ring-4 ring-secondary/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </div>
              <div className="mt-2 whitespace-nowrap rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-soft">
                Việt Nam · HQ
              </div>
            </div>

            {NETWORK_COUNTRIES.map((c) => (
              <div
                key={c.code}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${c.left}%`, top: `${c.top}%` }}
              >
                <div className="relative">
                  <span className="absolute inset-0 -m-1.5 animate-ping rounded-full bg-primary/30" />
                  <span className="relative block h-3 w-3 rounded-full bg-primary ring-4 ring-primary/15" />
                </div>
                <div className="mt-1.5 whitespace-nowrap rounded-md border border-primary/20 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary shadow-soft">
                  <span className="mr-1">{c.flag}</span>
                  {c.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary" /> Trụ sở Kaizen
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Quốc gia đối tác
          </div>
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" /> 8 quốc gia trọng điểm · 30+ đối tác chiến lược
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {NETWORK_COUNTRIES.map((c) => (
            <div
              key={c.code}
              className="group flex items-center gap-4 border border-line bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center bg-primary/5 text-3xl">{c.flag}</div>
              <div className="min-w-0">
                <div className="text-base font-bold text-foreground">{c.name}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">{c.role}</div>
              </div>
              <MapPin className="ml-auto h-4 w-4 shrink-0 text-secondary opacity-60 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
