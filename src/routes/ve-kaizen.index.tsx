import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import {
  EditorialHero,
  EditorialSection,
  Eyebrow,
  SerifTitle,
  StatBlock,
  
  CrossLink,
} from "@/components/editorial";
import { CmsHero } from "@/components/cms-hero";
import { Button } from "@/components/ui/button";
import { CuratedHighlightsSection } from "@/components/curated-highlights-section";
import { GlobalNetworkSection } from "@/components/global-network-section";
import { COMPANY } from "@/lib/markets";
import { getPageBanner } from "@/lib/page-banners.functions";
import ceoHuyenAsset from "@/assets/ceo-huyen.jpg.asset.json";

export const Route = createFileRoute("/ve-kaizen/")({
  loader: () => getPageBanner({ data: { page_key: "ve-kaizen" } }),
  head: () => ({
    meta: [
      { title: "Về Kaizen — Tổ chức Du học & Nhân lực quốc tế tại Nghệ An" },
      {
        name: "description",
        content:
          "Kaizen — đơn vị tiên phong tại Nghệ An về Du học, Xuất khẩu lao động, Ngoại ngữ và Hợp tác doanh nghiệp quốc tế. Sứ mệnh, tầm nhìn, giá trị cốt lõi.",
      },
      { property: "og:title", content: "Về Kaizen — Du học & Nhân lực quốc tế" },
      { property: "og:url", content: "https://kaizenmanpower.com/ve-kaizen" },
      {
        property: "og:description",
        content:
          "Hệ sinh thái Giáo dục & Nhân lực quốc tế của Kaizen, đồng hành cùng học sinh, người lao động và doanh nghiệp Việt Nam.",
      },
    ],
    links: [{ rel: "canonical", href: "https://kaizenmanpower.com/ve-kaizen" }],
  }),
  component: VeKaizenPage,
});

const PILLARS = [
  { title: "Nhân lực quốc tế", desc: "Đưa anh/chị lao động sang Nhật Bản, Hàn Quốc, Đài Loan, Đức và Đông Âu — minh bạch chi phí, hợp đồng rõ ràng.", to: "/xkld" },
  { title: "Du học quốc tế", desc: "Tư vấn 8 quốc gia, săn học bổng, đồng hành xin visa cho bạn học sinh.", to: "/du-hoc" },
  { title: "Trung tâm ngoại ngữ", desc: "Đào tạo tiếng Nhật, Hàn, Trung, Anh, Đức theo lộ trình chuẩn quốc tế.", to: "/ngoai-ngu" },
  { title: "Outsourcing nhân sự", desc: "Cung ứng nhân lực và giải pháp vận hành cho quý doanh nghiệp.", to: "/outsourcing" },
  { title: "Đối tác chiến lược", desc: "Mạng lưới hơn 500 trường, nghiệp đoàn và doanh nghiệp toàn cầu.", to: "/doi-tac" },
];

const VALUES = [
  { k: "Minh bạch", v: "Hợp đồng, chi phí, lộ trình công khai từ ngày đầu — không phát sinh phí ẩn." },
  { k: "Đồng hành", v: "Theo sát học viên và người lao động từ hồ sơ tới khi ổn định tại nước sở tại." },
  { k: "Chuẩn mực", v: "Quy trình tuân thủ pháp luật Việt Nam và yêu cầu của đối tác quốc tế." },
  { k: "Phát triển", v: "Tinh thần Kaizen — cải tiến không ngừng để mở rộng cơ hội cho người Việt." },
];

function VeKaizenPage() {
  const banner = Route.useLoaderData();
  return (
    <PublicLayout>
      <CmsHero
        banner={banner}
        fallback={
          <EditorialHero
            eyebrow="Về Kaizen"
            title={<>Kiến tạo cơ hội <em className="text-primary not-italic">vươn ra thế giới</em> cho người Việt</>}
            tagline="Hơn một thập kỷ đồng hành cùng học sinh, người lao động và doanh nghiệp Việt Nam — Kaizen định hình lại tiêu chuẩn dịch vụ Du học & Nhân lực quốc tế tại Nghệ An."
            imageUrl={ceoHuyenAsset.url}
            imageAlt="Đội ngũ Kaizen"
          />
        }
      />

      {/* Sứ mệnh & tầm nhìn */}
      <EditorialSection>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow>Sứ mệnh</Eyebrow>
            <SerifTitle className="mt-4 text-3xl md:text-4xl">
              Mở lối tương lai toàn cầu cho thế hệ trẻ Việt Nam.
            </SerifTitle>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Kaizen cung cấp giải pháp toàn diện: du học, xuất khẩu lao động, đào tạo ngoại ngữ và hợp tác doanh nghiệp — giúp mỗi cá nhân và tổ chức Việt Nam tiếp cận cơ hội quốc tế bằng con đường minh bạch, an toàn và hiệu quả nhất.
            </p>
          </div>
          <div>
            <Eyebrow>Tầm nhìn 2030</Eyebrow>
            <SerifTitle className="mt-4 text-3xl md:text-4xl">
              Thương hiệu số 1 về Du học & Nhân lực quốc tế tại khu vực Bắc Trung Bộ.
            </SerifTitle>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Đến năm 2030, Kaizen sẽ kết nối 20.000 học viên và người lao động Việt Nam với hệ sinh thái 1.000+ đối tác trường học, nghiệp đoàn và doanh nghiệp quốc tế.
            </p>
          </div>
        </div>
      </EditorialSection>

      {/* Số liệu */}
      <EditorialSection surface>
        <Eyebrow>Con số</Eyebrow>
        <SerifTitle className="mt-4 max-w-3xl text-3xl md:text-5xl">
          15 năm — một hành trình được đo bằng những người trẻ đã đi xa.
        </SerifTitle>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock value="5.000+" label="Học viên & người lao động" sub="đã xuất cảnh từ 2010" />
          <StatBlock value="98%" label="Tỷ lệ hồ sơ thành công" sub="trung bình 5 năm gần nhất" />
          <StatBlock value="20+" label="Quốc gia hợp tác" sub="châu Á, châu Âu, Bắc Mỹ" />
          <StatBlock value="500+" label="Đối tác trường & nghiệp đoàn" sub="mạng lưới quốc tế" />
        </div>
      </EditorialSection>

      {/* Giá trị cốt lõi */}
      <EditorialSection>
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
          <div>
            <Eyebrow>Giá trị cốt lõi</Eyebrow>
            <SerifTitle className="mt-4 text-3xl md:text-4xl">
              Bốn nguyên tắc làm nên Kaizen.
            </SerifTitle>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.k} className="border-t border-line pt-5">
                <div className="serif-display text-2xl font-semibold text-foreground">{v.k}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.v}</p>
              </div>
            ))}
          </div>
        </div>
      </EditorialSection>

      {/* Trụ cột */}
      <EditorialSection surface>
        <Eyebrow>Hệ sinh thái</Eyebrow>
        <SerifTitle className="mt-4 max-w-3xl text-3xl md:text-5xl">
          Năm trụ cột — một Kaizen.
        </SerifTitle>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Link
              key={p.title}
              to={p.to}
              className="group block border border-line bg-background p-7 transition-all hover:border-primary hover:-translate-y-0.5"
            >
              <div className="serif-display text-sm font-semibold tracking-wider text-primary">
                0{i + 1}
              </div>
              <div className="serif-display mt-2 text-2xl font-semibold text-foreground group-hover:text-primary">
                {p.title}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              <div className="mt-5 text-xs font-bold uppercase tracking-wider text-primary">
                Tìm hiểu →
              </div>
            </Link>
          ))}
        </div>
      </EditorialSection>

      {/* Điểm sáng — MOU, sự kiện, vinh danh */}
      <CuratedHighlightsSection />

      {/* Mạng lưới toàn cầu */}
      <GlobalNetworkSection />

      {/* Người sáng lập */}
      <EditorialSection>
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="relative">
              <div
                className="absolute -bottom-4 -right-4 hidden h-full w-full bg-primary/15 md:block"
                aria-hidden
              />
              <div className="relative overflow-hidden border border-line bg-background shadow-2xl shadow-neutral-900/20 ring-1 ring-neutral-900/5">
                <img
                  src={ceoHuyenAsset.url}
                  alt="Trịnh Thị Huyên — Founder & CEO Kaizen"
                  width={800}
                  height={1000}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <Eyebrow>Người sáng lập</Eyebrow>
            <div className="mt-4 serif-display text-2xl font-semibold leading-tight text-foreground md:text-3xl">
              Trịnh Thị Huyên · Founder & CEO Kaizen
            </div>
            <blockquote className="mt-6 border-l-2 border-primary pl-5 text-base font-medium italic leading-relaxed text-foreground/90 md:text-lg">
              “Mỗi học viên, mỗi người lao động Kaizen đưa đi là một niềm tin — và niềm tin ấy là tài sản lớn nhất của chúng tôi.”
            </blockquote>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-11 rounded-none bg-primary px-6 text-sm font-semibold tracking-wide text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/ve-kaizen/founder">Đọc về Founder</Link>
              </Button>
            </div>
          </div>
        </div>
      </EditorialSection>

      {/* CTA */}
      <EditorialSection surface>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Bắt đầu cùng Kaizen</Eyebrow>
          <SerifTitle className="mt-4 text-3xl md:text-5xl">
            Một cuộc trò chuyện có thể thay đổi cả một hành trình.
          </SerifTitle>
          <p className="mt-5 text-muted-foreground">
            Đội ngũ tư vấn Kaizen sẵn sàng đồng hành cùng bạn — miễn phí, đúng người, đúng lộ trình.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-none px-7">
              <Link to="/dang-ky">Đăng ký tư vấn</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-none border-2 px-7">
              <a href={`tel:${COMPANY.phone}`}>Gọi {COMPANY.phone}</a>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-wider">
            <CrossLink to="/ve-kaizen/founder">Founder & CEO</CrossLink>
            <CrossLink to="/ve-kaizen/phap-ly">Giấy phép & Pháp lý</CrossLink>
            <CrossLink to="/ve-kaizen/hanh-trinh">Hành trình thành công</CrossLink>
            <CrossLink to="/ve-kaizen/thu-vien">Thư viện</CrossLink>
          </div>
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
