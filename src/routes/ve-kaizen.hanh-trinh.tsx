import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { EditorialHero, EditorialSection, Eyebrow, SerifTitle, StatBlock, QuoteBlock, CrossLink } from "@/components/editorial";
import { Button } from "@/components/ui/button";
import { JourneyFlowSection } from "@/components/journey/journey-flow-section";
import { listPublishedMilestones } from "@/lib/journey.functions";

const milestonesQueryOptions = queryOptions({
  queryKey: ["journey-milestones"],
  queryFn: () => listPublishedMilestones(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/ve-kaizen/hanh-trinh")({
  head: () => ({
    meta: [
      { title: "Hành trình Kaizen — 15 năm Du học & Nhân lực quốc tế" },
      {
        name: "description",
        content:
          "Hành trình 15 năm của Kaizen: từ một văn phòng tư vấn du học nhỏ tại Nghệ An đến hệ sinh thái Du học & Nhân lực quốc tế phục vụ 5.000+ học viên.",
      },
      { property: "og:title", content: "Hành trình thành công — Kaizen" },
      { property: "og:url", content: "https://kaizenmanpower.com/ve-kaizen/hanh-trinh" },
    ],
    links: [{ rel: "canonical", href: "https://kaizenmanpower.com/ve-kaizen/hanh-trinh" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(milestonesQueryOptions),
  component: HanhTrinhPage,
});

function JourneyFlowLive() {
  const { data } = useSuspenseQuery(milestonesQueryOptions);
  return <JourneyFlowSection milestones={data} />;
}

const CASE_STUDIES = [
  { name: "Nguyễn V.A.", program: "Du học CHLB Đức 2024", outcome: "Học bổng nghề điều dưỡng — miễn 100% học phí, lương học việc 1.200 EUR/tháng.", quote: "Kaizen đồng hành từ A1 tiếng Đức tới ngày bay — phụ huynh ở quê cũng yên tâm." },
  { name: "Lê T.B.", program: "Thực tập sinh Nhật Bản 2023", outcome: "Đơn hàng cơ khí Aichi — thu nhập 32–38 triệu/tháng sau tăng ca.", quote: "Trước khi đi, tôi được học tiếng và tác phong 6 tháng tại Kaizen, sang Nhật vào việc rất nhanh." },
  { name: "Trần M.C.", program: "Du học Hàn Quốc 2024", outcome: "Visa D-4 tại Đại học Sejong — học bổng 30% học phí năm đầu.", quote: "Đội ngũ Kaizen sửa hồ sơ giúp tôi đến từng dấu chấm — đậu visa ngay vòng đầu." },
];

function HanhTrinhPage() {
  return (
    <PublicLayout>
      <EditorialHero
        eyebrow="Hành trình thành công"
        title={<>15 năm — <em className="text-primary not-italic">5.000 hành trình</em> đã đi xa</>}
        tagline="Mỗi cột mốc của Kaizen là một trang trong câu chuyện của những bạn học sinh, anh chị lao động và quý đối tác đã đặt niềm tin vào chúng tôi."
      />

      <EditorialSection>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock value="15" label="Năm hoạt động" sub="từ 2010" />
          <StatBlock value="5.000+" label="Học viên & người lao động" sub="đã xuất cảnh" />
          <StatBlock value="98%" label="Hồ sơ thành công" sub="trung bình 5 năm gần nhất" />
          <StatBlock value="20+" label="Quốc gia hợp tác" sub="châu Á, Âu, Bắc Mỹ" />
        </div>
      </EditorialSection>

      <JourneyFlowLive />


      <EditorialSection>
        <Eyebrow>Câu chuyện học viên</Eyebrow>
        <SerifTitle className="mt-4 max-w-3xl text-3xl md:text-5xl">
          Ba người trẻ — ba hành trình.
        </SerifTitle>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {CASE_STUDIES.map((c) => (
            <article key={c.name} className="flex flex-col border border-line bg-background p-7">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">{c.program}</div>
              <div className="serif-display mt-3 text-2xl font-semibold text-foreground">{c.name}</div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.outcome}</p>
              <blockquote className="mt-5 border-l-2 border-primary pl-4 text-sm italic leading-relaxed text-foreground">
                “{c.quote}”
              </blockquote>
            </article>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">* Tên học viên đã được rút gọn để bảo vệ quyền riêng tư.</p>
      </EditorialSection>

      <EditorialSection surface>
        <QuoteBlock
          quote="Mỗi tấm vé máy bay Kaizen trao đi không chỉ là một chuyến đi — đó là một tương lai."
          author="Đội ngũ Kaizen"
        />
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 rounded-none px-7">
            <Link to="/dang-ky">Bắt đầu hành trình của bạn</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-none border-2 px-7">
            <Link to="/ve-kaizen/thu-vien">Thư viện hình ảnh</Link>
          </Button>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <CrossLink to="/du-hoc">Du học</CrossLink>
          <CrossLink to="/xkld">Nhân lực quốc tế</CrossLink>
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
