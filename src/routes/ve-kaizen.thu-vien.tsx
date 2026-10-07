import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PlayCircle, Youtube, Facebook, ExternalLink } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { EditorialHero, EditorialSection, CrossLink } from "@/components/editorial";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import visaJP from "@/assets/success-visa-japan.jpg.asset.json";
import visaDE from "@/assets/success-visa-germany.jpg.asset.json";
import visaKR from "@/assets/success-visa-korea.jpg.asset.json";
import stuAirport from "@/assets/success-student-airport.jpg.asset.json";
import stuGroup from "@/assets/success-student-group.jpg.asset.json";
import stuWave from "@/assets/success-student-wave.jpg.asset.json";
import wrkJP from "@/assets/success-worker-aichi.jpg.asset.json";
import wrkTW from "@/assets/success-worker-taiwan.jpg.asset.json";
import wrkDE from "@/assets/success-worker-germany.jpg.asset.json";
import gradJP from "@/assets/success-grad-japan.jpg.asset.json";
import gradWork from "@/assets/success-grad-work.jpg.asset.json";
import gradCA from "@/assets/success-grad-canada.jpg.asset.json";

import {
  VIDEOS,
  VIDEO_CATS,
  CHANNELS,
  SOURCE_LABEL,
  type Video,
  type VideoCat,
  type VideoSource,
} from "@/lib/videos";

export const Route = createFileRoute("/ve-kaizen/thu-vien")({
  head: () => ({
    meta: [
      { title: "Thư viện hình ảnh & video — Hành trình Kaizen" },
      {
        name: "description",
        content:
          "Khoảnh khắc đậu visa, lễ tiễn bay, ngày lên đường, phỏng vấn học viên và video hoạt động của Kaizen — câu chuyện thật qua hình ảnh và video.",
      },
      { property: "og:title", content: "Thư viện đa phương tiện — Kaizen" },
      { property: "og:url", content: "https://kaizenmanpower.com/ve-kaizen/thu-vien" },
    ],
    links: [{ rel: "canonical", href: "https://kaizenmanpower.com/ve-kaizen/thu-vien" }],
  }),
  component: ThuVienPage,
});

type Cat = "visa" | "student" | "worker" | "graduation";

type Item = {
  cat: Cat;
  src: string;
  alt: string;
  caption: string;
  aspect: string;
  w: number;
  h: number;
};

const CAT_LABEL: Record<Cat, string> = {
  visa: "Visa thành công",
  student: "Học viên lên đường",
  worker: "Lao động xuất cảnh",
  graduation: "Câu chuyện tốt nghiệp",
};

const ITEMS: Item[] = [
  { cat: "visa", src: visaJP.url, alt: "Học viên Kaizen đậu visa Nhật Bản", caption: "Mai, 22 tuổi — đậu visa du học Nhật sau 8 tháng học JLPT N4.", aspect: "aspect-square", w: 1024, h: 1024 },
  { cat: "visa", src: visaDE.url, alt: "Học viên Kaizen nhận visa điều dưỡng Đức", caption: "Hùng cầm thư mời điều dưỡng Bayern — lương học việc 1.200 EUR/tháng.", aspect: "aspect-[4/5]", w: 1024, h: 1280 },
  { cat: "visa", src: visaKR.url, alt: "Sinh viên Kaizen đậu visa D-4 Hàn Quốc", caption: "Linh — visa D-4, ĐH Sejong, học bổng 30% năm đầu.", aspect: "aspect-[4/5]", w: 1024, h: 1280 },

  { cat: "student", src: stuAirport.url, alt: "Gia đình tiễn học viên Kaizen tại sân bay Nội Bài", caption: "Cái ôm cuối tại Nội Bài — 12 năm chờ ngày con bay sang Tokyo.", aspect: "aspect-square", w: 1024, h: 1024 },
  { cat: "student", src: stuGroup.url, alt: "Đoàn du học sinh Kaizen tại sân bay", caption: "Đoàn 18 du học sinh Kaizen — chuyến bay VN300 đi Osaka mùa thu 2024.", aspect: "aspect-[4/3]", w: 1024, h: 768 },
  { cat: "student", src: stuWave.url, alt: "Du học sinh vẫy tay tạm biệt tại sân bay", caption: "Cái vẫy tay cuối trước cửa an ninh — bắt đầu một chương mới.", aspect: "aspect-[4/5]", w: 1024, h: 1280 },

  { cat: "worker", src: wrkJP.url, alt: "Đoàn lao động Kaizen xuất cảnh sang Nhật Bản", caption: "23 kỹ thuật viên cơ khí Aichi — xuất cảnh tháng 03/2024.", aspect: "aspect-[4/3]", w: 1024, h: 768 },
  { cat: "worker", src: wrkTW.url, alt: "Nhóm lao động nữ Kaizen sang Đài Loan", caption: "Tổ điện tử nữ Cao Hùng — thu nhập 32 triệu/tháng, KTX miễn phí.", aspect: "aspect-square", w: 1024, h: 1024 },
  { cat: "worker", src: wrkDE.url, alt: "Điều dưỡng viên Kaizen tại sân bay Frankfurt", caption: "Frankfurt đón đoàn điều dưỡng Kaizen — bó hoa đầu tiên trên đất Đức.", aspect: "aspect-[4/3]", w: 1024, h: 768 },

  { cat: "graduation", src: gradJP.url, alt: "Học viên Kaizen tốt nghiệp đại học Nhật Bản", caption: "Trang — tốt nghiệp ĐH Waseda, ở lại làm việc tại Tokyo.", aspect: "aspect-[4/5]", w: 1024, h: 1280 },
  { cat: "graduation", src: gradWork.url, alt: "Cựu học viên Kaizen làm kỹ sư tại nhà máy Nhật", caption: "Nam — cựu TTS, nay là kỹ sư chính thức nhà máy Aichi sau 5 năm.", aspect: "aspect-square", w: 1024, h: 1024 },
  { cat: "graduation", src: gradCA.url, alt: "Du học sinh Kaizen tốt nghiệp tại Canada", caption: "Khánh — tốt nghiệp Conestoga, chính thức định cư Ontario 2024.", aspect: "aspect-square", w: 1024, h: 1024 },
];

const IMG_CATS = [
  { id: "all", label: "Tất cả" },
  { id: "visa", label: "Visa thành công" },
  { id: "student", label: "Học viên lên đường" },
  { id: "worker", label: "Lao động xuất cảnh" },
  { id: "graduation", label: "Câu chuyện tốt nghiệp" },
] as const;

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
            window.setTimeout(() => setVisible(true), (index % 3) * 90);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [index]);
  return { ref, visible };
}

function Tile({ item, i, onOpen }: { item: Item; i: number; onOpen: (it: Item) => void }) {
  const { ref, visible } = useReveal<HTMLButtonElement>(i);
  return (
    <button
      ref={ref}
      onClick={() => onOpen(item)}
      className={`group relative block w-full overflow-hidden rounded-lg bg-muted text-left transition-all duration-700 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      aria-label={item.alt}
    >
      <div className={`relative w-full ${item.aspect}`}>
        <img
          src={item.src}
          alt={item.alt}
          width={item.w}
          height={item.h}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute left-3 top-3">
          <span className="inline-block rounded-full bg-primary/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
            {CAT_LABEL[item.cat]}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
          <p className="text-sm font-medium leading-snug text-white md:text-base">
            {item.caption}
          </p>
        </div>
      </div>
    </button>
  );
}

function SourceIcon({ source, className }: { source: VideoSource; className?: string }) {
  if (source === "youtube") return <Youtube className={className} aria-hidden />;
  if (source === "facebook") return <Facebook className={className} aria-hidden />;
  // TikTok — lucide doesn't have it, use musical note glyph
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.6 6.3a5.4 5.4 0 0 1-3.8-1.6 5.4 5.4 0 0 1-1.5-3.2h-3.5v13.6a2.3 2.3 0 1 1-2.3-2.3c.2 0 .5 0 .7.1V9.3a5.9 5.9 0 0 0-.7 0 5.8 5.8 0 1 0 5.8 5.8V8.4a8.8 8.8 0 0 0 5.3 1.8V6.7c-.0 0 0-.4 0-.4Z" />
    </svg>
  );
}

function VideoTile({
  video,
  i,
  onOpen,
}: {
  video: Video;
  i: number;
  onOpen: (v: Video) => void;
}) {
  const { ref, visible } = useReveal<HTMLButtonElement>(i);
  const catLabel = VIDEO_CATS.find((c) => c.id === video.cat)?.label ?? "";
  return (
    <button
      ref={ref}
      onClick={() => onOpen(video)}
      className={`group relative block w-full overflow-hidden rounded-lg bg-muted text-left transition-all duration-700 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      aria-label={`Xem video: ${video.title}`}
    >
      <div className="relative aspect-video w-full">
        <img
          src={video.thumbnail}
          alt={video.title}
          width={1280}
          height={720}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        {/* Play button center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <PlayCircle
            className="h-16 w-16 text-white/90 drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
            strokeWidth={1.5}
          />
        </div>

        {/* Category badge top-left */}
        <div className="absolute left-3 top-3">
          <span className="inline-block rounded-full bg-primary/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
            {catLabel}
          </span>
        </div>

        {/* Source badge top-right */}
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
            <SourceIcon source={video.source} className="h-3 w-3" />
            {SOURCE_LABEL[video.source]}
          </span>
        </div>

        {/* Title bottom */}
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
          <p className="text-sm font-semibold leading-snug text-white md:text-base">
            {video.title}
          </p>
          {video.caption && (
            <p className="mt-1 line-clamp-2 text-xs text-white/80 md:text-[13px]">
              {video.caption}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function ChannelLinks() {
  const channels: { source: VideoSource; url: string; label: string }[] = [
    { source: "youtube", url: CHANNELS.youtube, label: "YouTube Kaizen" },
    { source: "facebook", url: CHANNELS.facebook, label: "Facebook Kaizen" },
    { source: "tiktok", url: CHANNELS.tiktok, label: "TikTok Kaizen" },
  ];
  return (
    <div className="mt-10 flex flex-wrap justify-center gap-3">
      {channels.map((c) => (
        <a
          key={c.source}
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <SourceIcon source={c.source} className="h-4 w-4" />
          Xem thêm trên {c.label}
          <ExternalLink className="h-3.5 w-3.5 opacity-60" />
        </a>
      ))}
    </div>
  );
}

function ThuVienPage() {
  const [imgActive, setImgActive] = useState<string>("all");
  const [imgOpen, setImgOpen] = useState<Item | null>(null);
  const imgShown = imgActive === "all" ? ITEMS : ITEMS.filter((i) => i.cat === imgActive);

  const [videoCat, setVideoCat] = useState<VideoCat | "all">("all");
  const [videoOpen, setVideoOpen] = useState<Video | null>(null);
  const videosShown =
    videoCat === "all" ? VIDEOS : VIDEOS.filter((v) => v.cat === videoCat);

  return (
    <PublicLayout>
      <EditorialHero
        eyebrow="Thư viện đa phương tiện"
        title={
          <>
            Mỗi khung hình — <em className="text-primary not-italic">một cánh cửa</em> mở ra thế giới
          </>
        }
        tagline="Hình ảnh và video chân thực từ các lễ tiễn bay, sự kiện công ty, phỏng vấn học viên và đợt tuyển sinh của Kaizen."
      />

      <EditorialSection>
        <Tabs defaultValue="images" className="w-full">
          <TabsList className="mx-auto mb-10 flex h-auto w-full max-w-md justify-center rounded-full bg-muted p-1.5">
            <TabsTrigger
              value="images"
              className="flex-1 rounded-full px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              Hình ảnh
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="flex-1 rounded-full px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              Video
            </TabsTrigger>
          </TabsList>

          {/* ====== IMAGES TAB ====== */}
          <TabsContent value="images" className="mt-0">
            <div className="mb-10 flex flex-wrap justify-center gap-2 md:gap-3">
              {IMG_CATS.map((c) => {
                const isActive = imgActive === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setImgActive(c.id)}
                    aria-pressed={isActive}
                    className={`inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-line bg-background text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 lg:gap-6">
              {imgShown.map((item, i) => (
                <div key={`${item.cat}-${i}`} className="mb-4 break-inside-avoid lg:mb-6">
                  <Tile item={item} i={i} onOpen={setImgOpen} />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ====== VIDEOS TAB ====== */}
          <TabsContent value="videos" className="mt-0">
            <div className="mb-10 flex flex-wrap justify-center gap-2 md:gap-3">
              <button
                onClick={() => setVideoCat("all")}
                aria-pressed={videoCat === "all"}
                className={`inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  videoCat === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-line bg-background text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                Tất cả
              </button>
              {VIDEO_CATS.map((c) => {
                const isActive = videoCat === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setVideoCat(c.id)}
                    aria-pressed={isActive}
                    className={`inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-line bg-background text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {videosShown.map((video, i) => (
                <VideoTile key={video.id} video={video} i={i} onOpen={setVideoOpen} />
              ))}
            </div>

            <ChannelLinks />
          </TabsContent>
        </Tabs>
      </EditorialSection>

      <EditorialSection surface>
        <div className="mx-auto max-w-2xl text-center">
          <div className="serif-display text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            Trở thành câu chuyện tiếp theo trong thư viện này.
          </div>
          <p className="mt-4 text-base text-muted-foreground">
            Mỗi tấm ảnh, mỗi thước phim ở trên đều bắt đầu bằng một buổi tư vấn miễn phí. Hành trình của bạn cũng vậy.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-none px-7">
              <Link to="/dang-ky">Bắt đầu hành trình của bạn</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-none border-2 px-7">
              <Link to="/ve-kaizen/hanh-trinh">Xem hành trình Kaizen</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <CrossLink to="/du-hoc">Du học</CrossLink>
            <CrossLink to="/xkld">Nhân lực quốc tế</CrossLink>
            <CrossLink to="/doi-tac">Đối tác quốc tế</CrossLink>
          </div>
        </div>
      </EditorialSection>

      {/* Image lightbox */}
      <Dialog open={!!imgOpen} onOpenChange={(o) => !o && setImgOpen(null)}>
        <DialogContent className="max-w-4xl border-none bg-background p-0">
          {imgOpen && (
            <div className="flex flex-col">
              <div className="relative w-full bg-black">
                <img
                  src={imgOpen.src}
                  alt={imgOpen.alt}
                  width={imgOpen.w}
                  height={imgOpen.h}
                  className="mx-auto max-h-[75vh] w-auto object-contain"
                />
              </div>
              <div className="p-5 md:p-6">
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {CAT_LABEL[imgOpen.cat]}
                </div>
                <p className="mt-2 text-base leading-relaxed text-foreground">
                  {imgOpen.caption}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video lightbox */}
      <Dialog open={!!videoOpen} onOpenChange={(o) => !o && setVideoOpen(null)}>
        <DialogContent className="max-w-4xl border-none bg-background p-0">
          {videoOpen && (
            <div className="flex flex-col">
              <div className="relative w-full bg-black">
                {videoOpen.embedUrl ? (
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={videoOpen.embedUrl}
                      title={videoOpen.title}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video w-full">
                    <img
                      src={videoOpen.thumbnail}
                      alt={videoOpen.title}
                      className="h-full w-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 p-6 text-center">
                      <p className="max-w-md text-base font-medium text-white md:text-lg">
                        Video này có trên kênh {SOURCE_LABEL[videoOpen.source]} chính thức của Kaizen.
                      </p>
                      <a
                        href={videoOpen.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        <SourceIcon source={videoOpen.source} className="h-4 w-4" />
                        Mở trên {SOURCE_LABEL[videoOpen.source]}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <SourceIcon source={videoOpen.source} className="h-3.5 w-3.5" />
                  {VIDEO_CATS.find((c) => c.id === videoOpen.cat)?.label}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-foreground md:text-xl">
                  {videoOpen.title}
                </h3>
                {videoOpen.caption && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {videoOpen.caption}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
