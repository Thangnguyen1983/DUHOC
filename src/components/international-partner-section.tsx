import { useEffect, useRef, useState } from "react";
import imgGermany from "@/assets/partner-germany.jpg.asset.json";
import imgJapan from "@/assets/partner-japan.jpg.asset.json";
import imgKorea from "@/assets/partner-korea.jpg.asset.json";
import imgTaiwan from "@/assets/partner-taiwan.jpg.asset.json";
import imgCanada from "@/assets/partner-canada.jpg.asset.json";
import imgEurope from "@/assets/partner-europe.jpg.asset.json";

type Partner = {
  flag: string;
  country: string;
  image: string;
  alt: string;
  partners: string;
  story: string;
  stats: string[];
};

const PARTNERS: Partner[] = [
  {
    flag: "🇩🇪",
    country: "CHLB Đức",
    image: imgGermany.url,
    alt: "Lễ ký kết hợp tác giữa Kaizen và nghiệp đoàn điều dưỡng CHLB Đức",
    partners: "Nghiệp đoàn điều dưỡng Bayern · Trường nghề BBW",
    story:
      "Ký MOU năm 2021, đã phái cử 200+ điều dưỡng viên và học viên Ausbildung — lương học việc 1.200 EUR/tháng, hỗ trợ định cư dài hạn.",
    stats: ["MOU 2021", "200+ điều dưỡng", "Lương 1.200 EUR"],
  },
  {
    flag: "🇯🇵",
    country: "Nhật Bản",
    image: imgJapan.url,
    alt: "Đoàn Kaizen thăm nhà máy đối tác tại Aichi, Nhật Bản",
    partners: "IM Japan · JITCO Partners (Aichi, Osaka)",
    story:
      "Hơn 10 năm hợp tác phái cử thực tập sinh và kỹ sư — 3.000+ lao động xuất cảnh thành công, tỷ lệ gia hạn hợp đồng đạt 92%.",
    stats: ["10+ năm", "3.000+ lao động", "Gia hạn 92%"],
  },
  {
    flag: "🇰🇷",
    country: "Hàn Quốc",
    image: imgKorea.url,
    alt: "Đại diện Kaizen ký MOU với đại học Hàn Quốc",
    partners: "ĐH Sejong · ĐH Hanyang · EPS Korea",
    story:
      "Tư vấn visa D-2/D-4 cho 500+ học viên mỗi năm. Top hồ sơ nhận học bổng 30–50% học phí năm đầu từ các đại học đối tác.",
    stats: ["500+ học viên/năm", "Học bổng 30-50%", "Visa D-2/D-4"],
  },
  {
    flag: "🇹🇼",
    country: "Đài Loan",
    image: imgTaiwan.url,
    alt: "Lao động Việt Nam tại xưởng điện tử của đối tác Đài Loan",
    partners: "Nghiệp đoàn Cao Hùng & Đài Trung",
    story:
      "Phái cử lao động ngành điện tử và cơ khí chính xác — thu nhập 28–35 triệu/tháng, ký túc xá miễn phí, môi trường làm việc hiện đại.",
    stats: ["28-35 tr/tháng", "KTX miễn phí", "Điện tử & cơ khí"],
  },
  {
    flag: "🇨🇦",
    country: "Canada",
    image: imgCanada.url,
    alt: "Học viên Kaizen tại campus cao đẳng Canada mùa thu",
    partners: "Conestoga College · Niagara College",
    story:
      "Lộ trình Study → Work → PR rõ ràng. Học viên Kaizen đầu tiên đã chính thức định cư tại Ontario năm 2024 sau 3 năm học và làm việc.",
    stats: ["Study-Work-PR", "PR năm 2024", "2 trường top"],
  },
  {
    flag: "🇪🇺",
    country: "Châu Âu",
    image: imgEurope.url,
    alt: "Ký kết hợp tác giữa Kaizen và hiệp hội tuyển dụng châu Âu",
    partners: "EU Workforce · Hungary · Ba Lan · Romania",
    story:
      "Mở rộng phái cử lao động kỹ thuật sang Đông Âu từ 2022 — visa lao động dài hạn 2 năm, được gia hạn không giới hạn và mở đường định cư EU.",
    stats: ["Từ 2022", "Visa 2 năm", "Định cư EU"],
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
            window.setTimeout(() => setVisible(true), (index % 3) * 100);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [index]);

  return { ref, visible };
}

function PartnerCard({ p, i }: { p: Partner; i: number }) {
  const { ref, visible } = useReveal<HTMLElement>(i);
  return (
    <article
      ref={ref}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-700 ease-out hover:shadow-soft ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={p.image}
          alt={p.alt}
          loading="lazy"
          width={1024}
          height={768}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
          <div className="serif-display text-2xl font-semibold leading-tight text-white md:text-3xl">
            {p.country}
          </div>
          <div className="text-3xl leading-none" aria-hidden>
            {p.flag}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {p.partners}
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {p.story}
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {p.stats.map((s) => (
            <li
              key={s}
              className="rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground"
            >
              {s}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function InternationalPartnerSection() {
  return (
    <section aria-label="Đối tác quốc tế" className="py-4">
      <div className="mx-auto max-w-2xl text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-primary" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            Mạng lưới hợp tác
          </span>
          <span className="h-px w-10 bg-primary" />
        </div>
        <h2 className="serif-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
          6 thị trường — những câu chuyện hợp tác thật
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Không phải logo trên slide — đây là những đối tác Kaizen đã ký kết,
          đồng hành và phái cử thành công hàng nghìn học viên, người lao động.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PARTNERS.map((p, i) => (
          <PartnerCard key={p.country} p={p} i={i} />
        ))}
      </div>
    </section>
  );
}
