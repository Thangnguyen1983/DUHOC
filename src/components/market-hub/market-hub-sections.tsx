import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, Lightbulb, HelpCircle, ArrowRight, Pin } from "lucide-react";
import { listMarketPosts, listMarketFaqs } from "@/lib/market-hub.functions";
import { useInView } from "@/hooks/use-in-view";

type Module = "xkld" | "du-hoc" | "ngoai-ngu" | "outsourcing" | "visa";

export function MarketHubSections({
  module,
  market,
  marketName,
}: {
  module: Module;
  market: string;
  marketName: string;
}) {
  const listPosts = useServerFn(listMarketPosts);
  const listFaqs = useServerFn(listMarketFaqs);

  const newsQ = useQuery({
    queryKey: ["market-news", module, market],
    queryFn: () => listPosts({ data: { module, market, categorySlug: "tin-tuc", limit: 12, offset: 0 } }),
  });
  const expQ = useQuery({
    queryKey: ["market-exp", module, market],
    queryFn: () => listPosts({ data: { module, market, categorySlug: "kinh-nghiem", limit: 12, offset: 0 } }),
  });
  const guideQ = useQuery({
    queryKey: ["market-guide", module, market],
    queryFn: () => listPosts({ data: { module, market, categorySlug: "huong-dan", limit: 12, offset: 0 } }),
  });
  const faqQ = useQuery({
    queryKey: ["market-faq", module, market],
    queryFn: () => listFaqs({ data: { module, market } }),
  });

  const anyNews = (newsQ.data?.items?.length ?? 0) > 0;
  const anyExp = (expQ.data?.items?.length ?? 0) > 0;
  const anyGuide = (guideQ.data?.items?.length ?? 0) > 0;
  const anyFaq = (faqQ.data?.length ?? 0) > 0;
  const anything = anyNews || anyExp || anyGuide || anyFaq;

  if (!anything && !newsQ.isLoading) {
    return (
      <section className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Chưa có bài viết cho thị trường <b>{marketName}</b>.
        </div>
      </section>
    );
  }

  return (
    <>
      {anyNews && (
        <MarketPostsBlock
          icon={<Newspaper className="h-5 w-5" />}
          title={`Tin tức thị trường ${marketName}`}
          subtitle="Cập nhật mới nhất từ chính sách, đơn hàng, học bổng, visa"
          items={newsQ.data!.items}
          viewAll={{ href: `/tin-tuc?market=${market}`, label: "Xem tất cả tin tức" }}
        />
      )}

      {anyExp && (
        <MarketPostsBlock
          icon={<Lightbulb className="h-5 w-5" />}
          title={`Kinh nghiệm từ ${marketName}`}
          subtitle="Câu chuyện thật của học viên/NLĐ đã và đang sinh sống tại thị trường"
          items={expQ.data!.items}
          viewAll={{ href: `/tin-tuc?market=${market}&category=kinh-nghiem`, label: "Xem tất cả" }}
          variant="secondary"
          layout="row"
        />
      )}

      {anyGuide && (
        <MarketPostsBlock
          icon={<Newspaper className="h-5 w-5" />}
          title={`Hướng dẫn — ${marketName}`}
          subtitle="Hồ sơ, quy trình, visa, thủ tục nhập cảnh và thích nghi"
          items={guideQ.data!.items}
          viewAll={{ href: `/tin-tuc?market=${market}&category=huong-dan`, label: "Xem tất cả hướng dẫn" }}
          layout="row"
        />
      )}

      {anyFaq && <FaqBlock marketName={marketName} items={faqQ.data!} />}
    </>
  );
}

function AnimatedSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <section
      ref={ref}
      className={`${className ?? ""} transform-gpu transition-all duration-700 ease-out will-change-transform ${
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      {children}
    </section>
  );
}

function MarketPostsBlock({
  icon,
  title,
  subtitle,
  items,
  viewAll,
  variant = "primary",
  layout = "marquee",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  items: any[];
  viewAll: { href: string; label: string };
  variant?: "primary" | "secondary";
  layout?: "marquee" | "row";
}) {
  const badgeClass = variant === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary";
  return (
    <AnimatedSection className="border-t py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`rounded-full p-2 ${badgeClass}`}>{icon}</span>
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <a
            href={viewAll.href}
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
          >
            {viewAll.label} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {layout === "marquee" ? (
        (() => {
          // Đảm bảo đủ item để loop mượt (>= 8 card trong 1 copy),
          // rồi nhân đôi cho keyframe translateX(-50%).
          // Tốc độ đồng nhất giữa các thị trường: mỗi card ~4s.
          const minCards = 8;
          const fillFactor = Math.max(1, Math.ceil(minCards / Math.max(items.length, 1)));
          const oneCopy = Array.from({ length: fillFactor }, () => items).flat();
          const track = [...oneCopy, ...oneCopy];
          const duration = Math.max(24, oneCopy.length * 4);
          return (
            <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
              <div
                className="animate-marquee-left flex w-max gap-3 [&:hover]:[animation-play-state:paused]"
                style={{ animationDuration: `${duration}s` }}
              >
                {track.map((p: any, i: number) => (
                  <PostCard key={`${p.id}-${i}`} post={p} className="w-[240px] shrink-0 sm:w-[260px]" />
                ))}
              </div>
            </div>
          );
        })()
      ) : (
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {items.slice(0, 5).map((p: any) => (
              <PostCard key={p.id} post={p} minimal />
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto mt-6 px-4 text-center sm:hidden">
        <a href={viewAll.href} className="text-sm font-medium text-primary">
          {viewAll.label} →
        </a>
      </div>
    </AnimatedSection>
  );
}

function PostCard({
  post: p,
  className = "",
  minimal = false,
}: {
  post: any;
  className?: string;
  minimal?: boolean;
}) {
  return (
    <a
      href={`/tin-tuc/${p.slug}`}
      className={`group/card overflow-hidden rounded-xl border bg-card transition-all duration-300 ${
        minimal
          ? "hover:-translate-y-0.5 hover:shadow-md"
          : "hover:-translate-y-1 hover:shadow-lg"
      } ${className}`}
    >
      {p.cover_image ? (
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={p.cover_image}
            alt={p.title}
            className={`h-full w-full object-cover ${
              minimal ? "" : "transition duration-500 group-hover/card:scale-105"
            }`}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-gradient-to-br from-accent to-muted" />
      )}
      <div className={`space-y-1.5 ${minimal ? "p-4" : "p-3"}`}>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {p.pinned && <Pin className="h-3 w-3 text-primary" />}
          {p.published_at && (
            <span>{new Date(p.published_at).toLocaleDateString("vi-VN")}</span>
          )}
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold group-hover/card:text-primary">{p.title}</h3>
      </div>
    </a>
  );
}

function FaqBlock({ marketName, items }: { marketName: string; items: any[] }) {
  return (
    <AnimatedSection className="border-t bg-accent/30 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center gap-3">
          <span className="rounded-full bg-primary/10 p-2 text-primary">
            <HelpCircle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-bold">Hỏi đáp — {marketName}</h2>
            <p className="text-sm text-muted-foreground">
              Những câu hỏi được quan tâm nhất về thị trường {marketName}
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl divide-y rounded-2xl border bg-card">
          {items.slice(0, 10).map((f: any) => (
            <details key={f.id} className="group px-4 py-3">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="mr-2 text-primary">Q.</span>
                {f.title}
              </summary>
              <div className="mt-2 pl-6 text-sm text-muted-foreground">
                {f.excerpt ?? "Xem chi tiết trong bài viết."}
                <Link
                  to="/tin-tuc/$slug"
                  params={{ slug: f.slug }}
                  className="ml-2 text-primary hover:underline"
                >
                  Chi tiết →
                </Link>
              </div>
            </details>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
