import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { ConsultationForm } from "@/components/consultation-form";
import { LANGUAGE_COURSES } from "@/lib/languages";
import { getPageBanner } from "@/lib/page-banners.functions";
import { CmsHero } from "@/components/cms-hero";
import { CheckCircle2, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/ngoai-ngu/$lang")({
  loader: async ({ params }) => {
    const course = LANGUAGE_COURSES[params.lang];
    if (!course) throw notFound();
    const banner = await getPageBanner({ data: { page_key: `ngoai-ngu:${params.lang}` } });
    return { course, banner };
  },
  head: ({ loaderData, params }) => {
    const c = loaderData?.course;
    const title = c ? `Khóa ${c.name} — KAIZEN` : "Đào tạo ngoại ngữ";
    const desc = c ? `${c.name}: ${c.tagline}. ${c.description}` : "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: `/ngoai-ngu/${params.lang}` },
      ],
      links: [{ rel: "canonical", href: `/ngoai-ngu/${params.lang}` }],
    };
  },
  component: NgoaiNguLang,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Không tìm thấy khóa học</h1>
        <Link to="/ngoai-ngu" className="mt-4 inline-block text-primary">← Về danh sách ngoại ngữ</Link>
      </div>
    </PublicLayout>
  ),
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center text-destructive">
        Lỗi: {error.message}
      </div>
    </PublicLayout>
  ),
});

function NgoaiNguLang() {
  const { course, banner } = Route.useLoaderData();
  return (
    <PublicLayout>
      <CmsHero
        banner={banner}
        fallback={
          <section className="bg-gradient-to-br from-accent via-background to-muted py-16">
            <div className="container mx-auto px-4">
              <div className="text-6xl">{course.flag}</div>
              <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
                Khóa <span className="text-gradient-brand">{course.name}</span>
              </h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{course.tagline}</p>
            </div>
          </section>
        }
      />

      <section className="container mx-auto grid gap-12 px-4 py-16 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold">Giới thiệu chương trình</h2>
          <p className="mt-3 text-muted-foreground">{course.description}</p>

          <h3 className="mt-8 text-xl font-bold">Các cấp độ đào tạo</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {course.levels.map((lv: string) => (
              <li key={lv} className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="font-medium">{lv}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-xl font-bold">Điểm nổi bật</h3>
          <ul className="mt-4 space-y-3">
            {course.highlights.map((h: string) => (
              <li key={h} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <span>{h}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-xl font-bold">Lộ trình học</h3>
          <ol className="mt-4 space-y-3 text-muted-foreground">
            <li><strong className="text-foreground">Bước 1.</strong> Kiểm tra trình độ đầu vào miễn phí.</li>
            <li><strong className="text-foreground">Bước 2.</strong> Xếp lớp theo cấp độ phù hợp.</li>
            <li><strong className="text-foreground">Bước 3.</strong> Học theo giáo trình chuẩn, kiểm tra định kỳ.</li>
            <li><strong className="text-foreground">Bước 4.</strong> Luyện đề & thi thử chứng chỉ.</li>
            <li><strong className="text-foreground">Bước 5.</strong> Đăng ký thi chứng chỉ chính thức.</li>
          </ol>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <ConsultationForm defaultProgram="du_hoc" />
        </div>
      </section>
    </PublicLayout>
  );
}
