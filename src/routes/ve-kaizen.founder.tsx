import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import {
  EditorialHero,
  EditorialSection,
  Eyebrow,
  SerifTitle,
  QuoteBlock,
  CrossLink,
} from "@/components/editorial";
import { Button } from "@/components/ui/button";
import ceoHuyenAsset from "@/assets/ceo-huyen.jpg.asset.json";

const PERSON_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Trịnh Thị Huyên",
  jobTitle: "Nhà sáng lập & Tổng giám đốc",
  worksFor: { "@type": "Organization", name: "Kaizen" },
  image: ceoHuyenAsset.url,
  address: { "@type": "PostalAddress", addressLocality: "Vinh", addressRegion: "Nghệ An", addressCountry: "VN" },
  knowsAbout: ["Du học quốc tế", "Xuất khẩu lao động", "Đào tạo ngoại ngữ", "Hợp tác doanh nghiệp"],
};

export const Route = createFileRoute("/ve-kaizen/founder")({
  head: () => ({
    meta: [
      { title: "Founder & CEO Trịnh Thị Huyên — Người sáng lập Kaizen" },
      {
        name: "description",
        content:
          "Bà Trịnh Thị Huyên — Nhà sáng lập & CEO Kaizen, người dành hơn 15 năm xây dựng hệ sinh thái Du học và Nhân lực quốc tế tại Nghệ An.",
      },
      { property: "og:title", content: "Founder & CEO Trịnh Thị Huyên — Kaizen" },
      { property: "og:url", content: "https://kaizenmanpower.com/ve-kaizen/founder" },
      { property: "og:type", content: "profile" },
      { property: "og:image", content: ceoHuyenAsset.url },
    ],
    links: [{ rel: "canonical", href: "https://kaizenmanpower.com/ve-kaizen/founder" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(PERSON_JSONLD) }],
  }),
  component: FounderPage,
});

const TIMELINE = [
  { y: "2008", t: "Khởi nghiệp trong lĩnh vực tư vấn du học Đông Á." },
  { y: "2012", t: "Thành lập Kaizen — mở rộng sang xuất khẩu lao động Nhật Bản." },
  { y: "2016", t: "Khai trương Trung tâm ngoại ngữ Kaizen tại Vinh, Nghệ An." },
  { y: "2020", t: "Mở rộng thị trường Đông Âu: Đức, Hungary, Ba Lan, Romania." },
  { y: "2024", t: "Hơn 5.000 học viên & người lao động Kaizen đã đi xa." },
];

function FounderPage() {
  return (
    <PublicLayout>
      <EditorialHero
        eyebrow="Founder & CEO"
        title={<>Trịnh Thị Huyên — <em className="text-primary not-italic">người mở đường</em></>}
        tagline="Hơn 15 năm trong lĩnh vực Giáo dục & Nhân lực quốc tế, bà Trịnh Thị Huyên là người đặt nền móng cho Kaizen và định hình chuẩn mực dịch vụ tử tế của ngành tại Nghệ An."
        imageUrl={ceoHuyenAsset.url}
        imageAlt="Bà Trịnh Thị Huyên — Nhà sáng lập Kaizen"
      />

      <EditorialSection>
        <div className="grid gap-16 lg:grid-cols-[1fr_2fr] lg:gap-20">
          <div>
            <Eyebrow>Tiểu sử</Eyebrow>
            <SerifTitle className="mt-4 text-3xl md:text-4xl">
              Một hành trình bắt đầu từ Nghệ An.
            </SerifTitle>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              Sinh ra và lớn lên tại Nghệ An, bà Trịnh Thị Huyên sớm nhận ra: khoảng cách giữa người trẻ Việt Nam và cơ hội quốc tế không nằm ở năng lực — mà nằm ở việc thiếu một con đường đi minh bạch.
            </p>
            <p>
              Năm 2008, bà bắt đầu công việc tư vấn du học Đông Á. Năm 2012, Kaizen ra đời, mở rộng sang xuất khẩu lao động Nhật Bản với một nguyên tắc duy nhất: <span className="font-semibold text-foreground">không thu phí ẩn, không hứa hẹn vượt thực tế</span>.
            </p>
            <p>
              Hơn một thập kỷ qua, dưới sự dẫn dắt của bà, Kaizen đã đưa hơn 5.000 học sinh và người lao động Việt Nam sang 20+ quốc gia, đồng thời xây dựng mạng lưới 500+ đối tác trường học, nghiệp đoàn và doanh nghiệp toàn cầu.
            </p>
          </div>
        </div>
      </EditorialSection>

      <EditorialSection surface>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow>Triết lý lãnh đạo</Eyebrow>
            <SerifTitle className="mt-4 text-3xl md:text-4xl">
              “Người đi xa phải về được — đó mới là thành công.”
            </SerifTitle>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Triết lý Kaizen — cải tiến liên tục — không chỉ là tên thương hiệu mà là cách bà Huyên vận hành tổ chức: mỗi quy trình đều được rà soát hàng quý, mỗi phản hồi của học viên đều trở thành dữ liệu để hoàn thiện dịch vụ.
            </p>
          </div>
          <div>
            <Eyebrow>Lĩnh vực chuyên môn</Eyebrow>
            <ul className="mt-4 space-y-3">
              {[
                "Tư vấn du học các thị trường Nhật, Hàn, Đài, Đức, Canada, Úc, Anh, Mỹ.",
                "Phái cử lao động và thực tập sinh kỹ năng sang Nhật Bản, Hàn Quốc, Đài Loan, Đức và Đông Âu.",
                "Hợp tác chiến lược với nghiệp đoàn, trường học, doanh nghiệp quốc tế.",
                "Đào tạo ngoại ngữ và kỹ năng tiền xuất cảnh.",
              ].map((x) => (
                <li key={x} className="flex gap-3 border-t border-line pt-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="text-primary">▸</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </EditorialSection>

      <EditorialSection>
        <Eyebrow>Cột mốc</Eyebrow>
        <SerifTitle className="mt-4 max-w-3xl text-3xl md:text-5xl">
          Hành trình của người sáng lập.
        </SerifTitle>
        <div className="mt-12 grid gap-8 md:grid-cols-5">
          {TIMELINE.map((m) => (
            <div key={m.y} className="border-t-2 border-primary pt-5">
              <div className="serif-display text-3xl font-semibold text-primary">{m.y}</div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.t}</p>
            </div>
          ))}
        </div>
      </EditorialSection>

      <EditorialSection surface>
        <QuoteBlock
          quote="Tôi muốn Kaizen là nơi mà phụ huynh ở Nghệ An yên tâm gửi con đi, người lao động yên tâm ký hợp đồng — và đối tác quốc tế tự hào khi hợp tác."
          author="Bà Trịnh Thị Huyên"
          role="Nhà sáng lập & CEO Kaizen"
        />
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 rounded-none px-7">
            <Link to="/dang-ky">Đăng ký tư vấn cùng Kaizen</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-none border-2 px-7">
            <Link to="/ve-kaizen/hanh-trinh">Xem hành trình Kaizen</Link>
          </Button>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <CrossLink to="/ve-kaizen/phap-ly">Giấy phép & Pháp lý</CrossLink>
          <CrossLink to="/ve-kaizen">Về Kaizen</CrossLink>
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
