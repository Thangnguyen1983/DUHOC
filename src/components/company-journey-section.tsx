import { useEffect, useRef, useState } from "react";
import img2008 from "@/assets/journey-2008.jpg.asset.json";
import img2010 from "@/assets/journey-2010.jpg.asset.json";
import img2014 from "@/assets/journey-2014.jpg.asset.json";
import img2018 from "@/assets/journey-2018.jpg.asset.json";
import img2021 from "@/assets/journey-2021.jpg.asset.json";
import img2025 from "@/assets/journey-2025.jpg.asset.json";

type Milestone = {
  year: string;
  title: string;
  description: string;
  image: string;
  alt: string;
};

const MILESTONES: Milestone[] = [
  {
    year: "2008–2009",
    title: "Khởi nguồn & phát triển ban đầu",
    description:
      "Đặt nền móng trong lĩnh vực tư vấn giáo dục tại Nghệ An — hình thành đội ngũ cốt lõi và triết lý đồng hành cùng học viên.",
    image: img2008.url,
    alt: "Văn phòng tư vấn giáo dục Kaizen giai đoạn đầu",
  },
  {
    year: "2010",
    title: "Chính thức thành lập Kaizen Manpower",
    description:
      "Văn phòng đầu tiên tại thành phố Vinh — khởi đầu chính thức cho hành trình tư vấn du học Đông Á.",
    image: img2010.url,
    alt: "Lễ khai trương văn phòng Kaizen Manpower năm 2010",
  },
  {
    year: "2014",
    title: "Cấp phép phái cử lao động quốc tế",
    description:
      "Được Bộ LĐ-TB&XH cấp phép hoạt động đưa người lao động đi làm việc tại Nhật Bản và Hàn Quốc.",
    image: img2014.url,
    alt: "Người lao động Việt Nam xuất cảnh sang Nhật Bản",
  },
  {
    year: "2018",
    title: "Mở rộng giáo dục quốc tế",
    description:
      "Khai trương trung tâm đào tạo Nhật ngữ, Hàn ngữ chuẩn JLPT/TOPIK — tích hợp đào tạo và xuất cảnh trong cùng hệ sinh thái.",
    image: img2018.url,
    alt: "Lớp học tiếng Nhật tại trung tâm đào tạo Kaizen",
  },
  {
    year: "2021",
    title: "Mở rộng mạng lưới đối tác quốc tế",
    description:
      "Hợp tác chính thức với các nghiệp đoàn CHLB Đức, Hungary, Ba Lan, Đài Loan — vươn ra thị trường châu Âu.",
    image: img2021.url,
    alt: "Ký kết hợp tác giữa Kaizen và đối tác châu Âu",
  },
  {
    year: "2025",
    title: "Thành tựu hiện tại",
    description:
      "Hệ sinh thái 5 trụ cột dịch vụ, hơn 20.000 học viên & người lao động xuất cảnh thành công, hơn 500 đối tác toàn cầu.",
    image: img2025.url,
    alt: "Đội ngũ Kaizen hiện tại trong văn phòng quốc tế",
  },
];

function useReveal<T extends HTMLElement>(index: number) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            window.setTimeout(() => setVisible(true), index * 100);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.25 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [index]);

  return { ref, visible };
}

function MilestoneRow({ m, i }: { m: Milestone; i: number }) {
  const { ref, visible } = useReveal<HTMLDivElement>(i);
  const isLeft = i % 2 === 0;

  return (
    <div
      ref={ref}
      className={`relative grid gap-6 transition-all duration-700 ease-out md:grid-cols-2 md:gap-12 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      {/* Center dot (desktop) */}
      <span
        aria-hidden
        className="absolute left-[14px] top-6 hidden h-3 w-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background md:left-1/2 md:block"
      />
      {/* Mobile dot */}
      <span
        aria-hidden
        className="absolute left-[14px] top-6 h-3 w-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background md:hidden"
      />

      {/* Image */}
      <div
        className={`pl-10 md:pl-0 ${
          isLeft ? "md:order-1 md:pr-10" : "md:order-2 md:pl-10"
        }`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden ring-1 ring-inset ring-line">
          <img
            src={m.image}
            alt={m.alt}
            loading="lazy"
            width={1024}
            height={768}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Text */}
      <div
        className={`pl-10 md:pl-0 ${
          isLeft ? "md:order-2 md:pl-10" : "md:order-1 md:pr-10 md:text-right"
        }`}
      >
        <div className="serif-display text-4xl font-semibold text-primary md:text-5xl">
          {m.year}
        </div>
        <div className="mt-3 text-sm font-bold uppercase tracking-wider text-foreground">
          {m.title}
        </div>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
          {m.description}
        </p>
      </div>
    </div>
  );
}

export function CompanyJourneySection() {
  return (
    <section
      aria-label="Hành trình phát triển Kaizen"
      className="bg-surface py-20 md:py-28"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              Hành trình Kaizen
            </span>
            <span className="h-px w-10 bg-primary" />
          </div>
          <h2 className="serif-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            15 năm — một hành trình kiên định
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Từ một văn phòng tư vấn nhỏ tại Nghệ An đến hệ sinh thái Du học &amp;
            Nhân lực quốc tế phục vụ hàng chục nghìn học viên và người lao động.
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          {/* Vertical line */}
          <span
            aria-hidden
            className="absolute left-[14px] top-0 h-full w-px bg-primary/20 md:left-1/2"
          />
          <div className="space-y-16 md:space-y-24">
            {MILESTONES.map((m, i) => (
              <MilestoneRow key={m.year} m={m} i={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
