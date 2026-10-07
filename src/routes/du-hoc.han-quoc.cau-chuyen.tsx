import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageHero } from "@/components/page-hero";
import { ConsultationForm } from "@/components/consultation-form";
import { HAN_QUOC_STORIES } from "@/lib/han-quoc/stories";
import { ArrowRight } from "lucide-react";

const PAGE_URL = "https://kaizenmanpower.com/du-hoc/han-quoc/cau-chuyen";

export const Route = createFileRoute("/du-hoc/han-quoc/cau-chuyen")({
  head: () => ({
    meta: [
      { title: "Câu chuyện thành công học viên Kaizen tại Hàn Quốc" },
      {
        name: "description",
        content:
          "Câu chuyện thật của học viên Kaizen xuất cảnh và khai giảng tại Hàn Quốc 2024 – 2026. Trung tâm du học Hàn Quốc uy tín tại Nghệ An.",
      },
      { property: "og:title", content: "Câu chuyện thành công học viên Kaizen tại Hàn Quốc" },
      { property: "og:description", content: "Hành trình của 2.000+ học viên Kaizen tại xứ sở kim chi." },
      { property: "og:url", content: PAGE_URL },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: StoriesPage,
});

function StoriesPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Câu chuyện thành công"
        title={<>Học viên Kaizen <span className="text-gradient-brand">tại Hàn Quốc</span></>}
        description="Những hành trình xuất cảnh và khai giảng thật của học viên Kaizen 2024 – 2026."
      />

      <section className="container mx-auto px-4 py-12">
        <p className="mb-8 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
          <strong>Lưu ý:</strong> Tên học viên được rút gọn và hình ảnh là minh hoạ để bảo vệ thông tin cá nhân theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HAN_QUOC_STORIES.map((s) => (
            <article key={s.slug} className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[0_2px_18px_-12px_rgba(15,23,42,0.18)]">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={s.image}
                  alt={`Học viên Kaizen ${s.studentName} tại ${s.university}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-primary">
                  Visa {s.visaType}
                </span>
                <span className="absolute left-3 top-3 rounded-full bg-[#3F7D3A] px-2.5 py-1 text-[10px] font-bold text-white">
                  Xuất cảnh {s.year}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{s.studentName}, {s.age} tuổi</span>
                  <span>{s.hometown}</span>
                </div>
                <h2 className="mt-2 text-lg font-bold">{s.university}</h2>
                <p className="text-xs text-muted-foreground">Chuyên ngành: {s.major}</p>
                <blockquote className="mt-4 border-l-2 border-primary pl-4 text-sm italic text-foreground/80">
                  "{s.quote}"
                </blockquote>
                <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-[#3F7D3A]/10 px-3 py-1 text-xs font-semibold text-[#3F7D3A]">
                  ✓ {s.highlight}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-extrabold md:text-3xl">
              Sẵn sàng viết <span className="text-gradient-brand">câu chuyện của bạn</span>?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Hàng nghìn học viên Kaizen đã thực hiện ước mơ du học Hàn Quốc. Bạn sẽ là người tiếp theo.
            </p>
            <Link
              to="/du-hoc/han-quoc"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Xem lộ trình du học Hàn Quốc <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="lg:col-span-3">
            <ConsultationForm defaultProgram="du_hoc" defaultMarket="han-quoc" />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
