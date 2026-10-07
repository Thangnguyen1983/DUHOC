import thumbActivity from "@/assets/video-thumb-activity.jpg";
import thumbDeparture from "@/assets/video-thumb-departure.jpg";
import thumbInterview from "@/assets/video-thumb-interview.jpg";
import thumbRecruitment from "@/assets/video-thumb-recruitment.jpg";

export type VideoCat = "activity" | "departure" | "interview" | "recruitment";
export type VideoSource = "youtube" | "facebook" | "tiktok";

export type Video = {
  id: string;
  source: VideoSource;
  /** External URL to open when user clicks (channel link if no specific video yet). */
  url: string;
  /** Optional iframe-embeddable URL for YouTube/Facebook. If absent, opens in new tab. */
  embedUrl?: string;
  /** Local fallback thumbnail. */
  thumbnail: string;
  title: string;
  cat: VideoCat;
  /** Optional caption shown under title. */
  caption?: string;
};

/**
 * Kênh truyền thông chính thức của Kaizen.
 * Cards click → mở kênh tương ứng cho đến khi có videoId cụ thể.
 * Khi có video thật, cập nhật `url` thành link video + thêm `embedUrl`.
 */
export const CHANNELS = {
  youtube:
    "https://www.youtube.com/@C%C3%B4ngtyC%E1%BB%95ph%E1%BA%A7nNh%C3%A2nl%E1%BB%B1cQu%E1%BB%91ct%E1%BA%BFKaize",
  facebook: "https://www.facebook.com/kaizeneducation68/",
  tiktok: "https://www.tiktok.com/@kaizen_duhoc_xkld",
} as const;

export const VIDEO_CATS: { id: VideoCat; label: string; description: string }[] = [
  {
    id: "activity",
    label: "Kaizen trong hành động",
    description: "Hoạt động đào tạo, sự kiện và đời sống tại trụ sở Kaizen.",
  },
  {
    id: "departure",
    label: "Khoảnh khắc khởi hành",
    description: "Lễ tiễn bay, sân bay và những cái ôm cuối trước chuyến đi xa.",
  },
  {
    id: "interview",
    label: "Câu chuyện thật",
    description: "Phỏng vấn học viên, lao động đang sống và làm việc ở nước ngoài.",
  },
  {
    id: "recruitment",
    label: "Tuyển sinh & Tuyển dụng",
    description: "Đơn hàng mới, lịch tuyển sinh và cơ hội đang mở.",
  },
];

export const SOURCE_LABEL: Record<VideoSource, string> = {
  youtube: "YouTube",
  facebook: "Facebook",
  tiktok: "TikTok",
};

export const VIDEOS: Video[] = [
  // ====== Kaizen trong hành động ======
  {
    id: "act-yt-1",
    cat: "activity",
    source: "youtube",
    url: CHANNELS.youtube,
    thumbnail: thumbActivity,
    title: "Một ngày tại trụ sở Kaizen",
    caption: "Đào tạo tiếng Nhật, phỏng vấn đơn hàng, sinh hoạt nội trú.",
  },
  {
    id: "act-fb-1",
    cat: "activity",
    source: "facebook",
    url: CHANNELS.facebook,
    thumbnail: thumbActivity,
    title: "Lễ khai giảng khoá tiếng Nhật N4",
    caption: "Khoảnh khắc cắt băng và phát biểu của Ban Giám đốc.",
  },
  {
    id: "act-tt-1",
    cat: "activity",
    source: "tiktok",
    url: CHANNELS.tiktok,
    thumbnail: thumbActivity,
    title: "Đời sống nội trú Kaizen — 60 giây",
    caption: "Hậu trường ký túc xá, bếp ăn và lớp học buổi tối.",
  },

  // ====== Khoảnh khắc khởi hành ======
  {
    id: "dep-yt-1",
    cat: "departure",
    source: "youtube",
    url: CHANNELS.youtube,
    thumbnail: thumbDeparture,
    title: "Lễ tiễn bay đoàn TTS sang Aichi",
    caption: "23 kỹ thuật viên xuất cảnh — nước mắt và lời hứa.",
  },
  {
    id: "dep-fb-1",
    cat: "departure",
    source: "facebook",
    url: CHANNELS.facebook,
    thumbnail: thumbDeparture,
    title: "Nội Bài 3 giờ sáng — đoàn du học Osaka",
    caption: "Gia đình tiễn 18 bạn du học sinh trước cửa an ninh.",
  },
  {
    id: "dep-tt-1",
    cat: "departure",
    source: "tiktok",
    url: CHANNELS.tiktok,
    thumbnail: thumbDeparture,
    title: "Cái vẫy tay cuối — 30 giây nghẹn lòng",
    caption: "Clip viral 1 triệu view trên TikTok Kaizen.",
  },

  // ====== Câu chuyện thật ======
  {
    id: "int-yt-1",
    cat: "interview",
    source: "youtube",
    url: CHANNELS.youtube,
    thumbnail: thumbInterview,
    title: "Mai — 8 tháng học N4 và visa Nhật",
    caption: "Phỏng vấn cận cảnh hành trình từ Nghệ An đến Tokyo.",
  },
  {
    id: "int-fb-1",
    cat: "interview",
    source: "facebook",
    url: CHANNELS.facebook,
    thumbnail: thumbInterview,
    title: "Hùng — điều dưỡng viên tại Bayern",
    caption: "Một năm ở Đức: lương 1.200 EUR và bài học đầu đời.",
  },
  {
    id: "int-tt-1",
    cat: "interview",
    source: "tiktok",
    url: CHANNELS.tiktok,
    thumbnail: thumbInterview,
    title: "Nam — từ TTS đến kỹ sư chính thức",
    caption: "5 năm ở Aichi kể trong 90 giây.",
  },

  // ====== Tuyển sinh & Tuyển dụng ======
  {
    id: "rec-yt-1",
    cat: "recruitment",
    source: "youtube",
    url: CHANNELS.youtube,
    thumbnail: thumbRecruitment,
    title: "Đơn hàng cơ khí Aichi — đang tuyển",
    caption: "Chi tiết lương, điều kiện và lịch phỏng vấn tháng tới.",
  },
  {
    id: "rec-fb-1",
    cat: "recruitment",
    source: "facebook",
    url: CHANNELS.facebook,
    thumbnail: thumbRecruitment,
    title: "Tuyển sinh khoá điều dưỡng Đức 2026",
    caption: "Hỗ trợ học bổng — phỏng vấn trực tiếp với đối tác.",
  },
  {
    id: "rec-tt-1",
    cat: "recruitment",
    source: "tiktok",
    url: CHANNELS.tiktok,
    thumbnail: thumbRecruitment,
    title: "5 điều cần biết trước khi đăng ký XKLĐ",
    caption: "Clip cẩm nang nhanh cho bạn mới tìm hiểu.",
  },
];
