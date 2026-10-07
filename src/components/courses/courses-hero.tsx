import { GraduationCap, PlayCircle, BadgeCheck, Infinity as InfinityIcon, MonitorPlay } from "lucide-react";
import heroAsset from "@/assets/elearning-hero.jpg.asset.json";

interface CoursesHeroProps {
  courseCount: number;
  lessonCount: number;
  studentCount: number;
}

const STATS = (p: CoursesHeroProps) => [
  { value: `${p.courseCount}+`, label: "Khoá học đang mở" },
  { value: `${p.lessonCount}+`, label: "Bài giảng video" },
  { value: `${p.studentCount.toLocaleString("vi-VN")}+`, label: "Học viên đã đăng ký" },
  { value: "4.8/5", label: "Điểm hài lòng" },
];

const PERKS = [
  { icon: MonitorPlay, text: "Học mọi lúc trên điện thoại" },
  { icon: InfinityIcon, text: "Sở hữu khoá học trọn đời" },
  { icon: BadgeCheck, text: "Chứng chỉ hoàn thành" },
];

/**
 * Hero khu vực E-learning — tông sáng, tươi, dùng bộ màu nhận diện Kaizen
 * (đỏ thương hiệu + xanh lá thương hiệu) trên nền kem sáng.
 */
export function CoursesHero(props: CoursesHeroProps) {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Lớp màu nhận diện Kaizen — sáng, dịu */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_8%_0%,color-mix(in_oklab,var(--brand-green)_20%,transparent)_0%,transparent_62%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(110%_95%_at_98%_10%,color-mix(in_oklab,var(--brand-red)_14%,transparent)_0%,transparent_60%)]" />
      {/* Lưới mảnh gợi không gian lớp học số */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--brand-green) 16%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--brand-green) 16%, transparent) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(75% 70% at 50% 40%, #000 30%, transparent 100%)",
        }}
      />

      <div className="container relative mx-auto grid gap-10 px-4 py-14 md:py-18 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[color-mix(in_oklab,var(--brand-green)_35%,transparent)] bg-card px-4 py-2 shadow-sm">
            <GraduationCap className="h-4 w-4 text-brand-green" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
              Kaizen E-learning
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Khoá học trực tuyến
            <span className="mt-2 block bg-[linear-gradient(100deg,var(--brand-red),#E4573F_45%,var(--brand-green))] bg-clip-text text-transparent">
              nổi bật của Kaizen
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Tiếng Hàn, tiếng Nhật, tiếng Đức và kỹ năng làm việc nước ngoài. Giảng viên chuyên môn cao,
            lộ trình bám sát kỳ thi, học linh hoạt theo tốc độ của bạn.
          </p>

          <ul className="mt-7 flex flex-wrap gap-2.5">
            {PERKS.map((p) => (
              <li
                key={p.text}
                className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--brand-green)_28%,transparent)] bg-card px-3.5 py-1.5 text-sm text-foreground shadow-sm"
              >
                <p.icon className="h-4 w-4 text-brand-green" aria-hidden="true" />
                {p.text}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#danh-sach-khoa-hoc"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-brand transition-colors hover:bg-[var(--brand-red-dark)]"
            >
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              Xem tất cả khoá học
            </a>
            <a
              href="/dang-ky?src=khoa-hoc"
              className="inline-flex min-h-[44px] items-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Nhận tư vấn lộ trình miễn phí
            </a>
          </div>
        </div>

        {/* Ảnh minh hoạ + bảng số liệu */}
        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
            <img
              src={heroAsset.url}
              alt="Học viên Kaizen học ngoại ngữ trực tuyến bằng máy tính tại nhà"
              width={1200}
              height={912}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
            {STATS(props).map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card p-4 shadow-md sm:p-5"
              >
                <div className="text-2xl font-bold text-primary sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs leading-snug text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-[linear-gradient(90deg,transparent,var(--brand-red),var(--brand-green),transparent)]" />
    </section>
  );
}
