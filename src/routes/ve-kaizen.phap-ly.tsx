import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { EditorialHero, EditorialSection, Eyebrow, SerifTitle, CrossLink } from "@/components/editorial";
import { Button } from "@/components/ui/button";
import { TrustFoundationSection } from "@/components/trust-foundation-section";
import { COMPANY } from "@/lib/markets";
import { FileCheck2, ShieldCheck, Building2, Stamp } from "lucide-react";

export const Route = createFileRoute("/ve-kaizen/phap-ly")({
  head: () => ({
    meta: [
      { title: "Giấy phép & Pháp lý — Kaizen hoạt động minh bạch, hợp pháp" },
      {
        name: "description",
        content:
          "Toàn bộ giấy phép kinh doanh, giấy phép XKLĐ, giấy phép tư vấn du học và chứng nhận hợp pháp của Kaizen tại Việt Nam và quốc tế.",
      },
      { property: "og:title", content: "Giấy phép & Pháp lý — Kaizen" },
      { property: "og:url", content: "https://kaizenmanpower.com/ve-kaizen/phap-ly" },
    ],
    links: [{ rel: "canonical", href: "https://kaizenmanpower.com/ve-kaizen/phap-ly" }],
  }),
  component: PhapLyPage,
});

const DOCS = [
  { icon: Building2, t: "Giấy chứng nhận ĐKKD", n: "Do Sở KH&ĐT Nghệ An cấp", d: "Mã số doanh nghiệp công khai trên Cổng thông tin quốc gia." },
  { icon: FileCheck2, t: "Giấy phép hoạt động dịch vụ đưa người lao động Việt Nam đi làm việc ở nước ngoài", n: "Bộ Lao động – Thương binh và Xã hội", d: "Hoạt động phái cử lao động sang Nhật Bản, Hàn Quốc, Đài Loan, CHLB Đức và Đông Âu." },
  { icon: Stamp, t: "Giấy chứng nhận hoạt động tư vấn du học", n: "Sở Giáo dục & Đào tạo Nghệ An", d: "Tư vấn, hỗ trợ thủ tục du học cho 8 quốc gia trọng điểm." },
  { icon: ShieldCheck, t: "Chứng nhận hợp tác đối tác quốc tế", n: "Nghiệp đoàn, trường học, doanh nghiệp nước ngoài", d: "Hệ thống biên bản ghi nhớ (MOU) và hợp đồng phái cử trực tiếp." },
];

function PhapLyPage() {
  return (
    <PublicLayout>
      <EditorialHero
        eyebrow="Giấy phép & Pháp lý"
        title={<>Hoạt động <em className="text-primary not-italic">minh bạch</em>, được pháp luật bảo vệ</>}
        tagline="Kaizen vận hành đầy đủ giấy phép theo quy định của pháp luật Việt Nam và đáp ứng yêu cầu của đối tác quốc tế. Toàn bộ hồ sơ có thể tra cứu công khai."
      />

      <EditorialSection>
        <div className="grid gap-6 md:grid-cols-2">
          {DOCS.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.t} className="border border-line bg-background p-7 transition-colors hover:border-primary">
                <Icon className="h-8 w-8 text-primary" />
                <div className="serif-display mt-4 text-xl font-semibold leading-snug text-foreground">
                  {d.t}
                </div>
                <div className="mt-2 text-xs font-bold uppercase tracking-wider text-primary">
                  {d.n}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d.d}</p>
                <div className="mt-5 inline-flex items-center gap-2 border border-dashed border-line bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Bản scan cập nhật sau
                </div>
              </div>
            );
          })}
        </div>
      </EditorialSection>

      <EditorialSection surface>
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
          <div>
            <Eyebrow>Cam kết tuân thủ</Eyebrow>
            <SerifTitle className="mt-4 text-3xl md:text-4xl">
              Mọi hợp đồng đều rõ ràng — từ phí dịch vụ đến điều khoản hoàn trả.
            </SerifTitle>
          </div>
          <ul className="space-y-4">
            {[
              "Hợp đồng đúng mẫu Bộ LĐ-TB&XH, in song ngữ với thị trường yêu cầu.",
              "Phí dịch vụ niêm yết công khai theo từng đơn hàng, từng chương trình.",
              "Bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.",
              "Chính sách hoàn trả minh bạch khi hồ sơ không đạt yêu cầu của đối tác.",
            ].map((x) => (
              <li key={x} className="flex gap-3 border-t border-line pt-4 text-base leading-relaxed text-foreground">
                <span className="text-primary">✓</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </EditorialSection>

      <TrustFoundationSection />

      <EditorialSection>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Cần kiểm tra hồ sơ pháp lý?</Eyebrow>
          <SerifTitle className="mt-4 text-3xl md:text-4xl">
            Chúng tôi sẵn sàng gửi bản đầy đủ theo yêu cầu của quý đối tác.
          </SerifTitle>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-none px-7">
              <Link to="/lien-he">Liên hệ Kaizen</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-none border-2 px-7">
              <a href={`tel:${COMPANY.phone}`}>Gọi {COMPANY.phone}</a>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <CrossLink to="/ve-kaizen">Về Kaizen</CrossLink>
            <CrossLink to="/ve-kaizen/founder">Founder & CEO</CrossLink>
          </div>
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
