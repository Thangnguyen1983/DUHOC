export type LanguageCourse = {
  slug: string;
  name: string;
  flag: string;
  tagline: string;
  description: string;
  levels: string[];
  highlights: string[];
};

export const LANGUAGE_COURSES: Record<string, LanguageCourse> = {
  "tieng-nhat": {
    slug: "tieng-nhat",
    name: "Tiếng Nhật",
    flag: "🇯🇵",
    tagline: "JLPT N5 — N1, luyện thi & giao tiếp thực chiến",
    description:
      "Lộ trình tiếng Nhật từ N5 đến N1 với giáo viên người Việt + người Nhật. Phù hợp học viên du học, kỹ năng đặc định, thực tập sinh.",
    levels: ["Sơ cấp N5 – N4", "Trung cấp N3", "Cao cấp N2 – N1", "Luyện thi đặc định / TITP"],
    highlights: [
      "Giáo trình Minna no Nihongo + Mimi Kara",
      "Lớp nhỏ 10–15 học viên, học 5 buổi/tuần",
      "Cam kết đầu ra JLPT theo cấp độ",
      "Học phí ưu đãi cho học viên du học/XKLĐ KAIZEN",
    ],
  },
  "tieng-han": {
    slug: "tieng-han",
    name: "Tiếng Hàn",
    flag: "🇰🇷",
    tagline: "TOPIK I — II, EPS-TOPIK, giao tiếp Hàn Quốc",
    description:
      "Đào tạo tiếng Hàn theo chuẩn TOPIK và chương trình EPS dành cho người lao động đi Hàn Quốc.",
    levels: ["Sơ cấp TOPIK I (1–2)", "Trung cấp TOPIK II (3–4)", "Cao cấp TOPIK (5–6)", "Luyện thi EPS-TOPIK"],
    highlights: [
      "Giáo trình Seoul University + đề thi EPS chính thức",
      "Giáo viên tốt nghiệp tại Hàn Quốc",
      "Luyện nghe – nói chuyên sâu",
      "Hỗ trợ đăng ký thi TOPIK & EPS",
    ],
  },
  "tieng-trung": {
    slug: "tieng-trung",
    name: "Tiếng Trung",
    flag: "🇨🇳",
    tagline: "HSK 1 — HSK 6 và tiếng Trung giao tiếp",
    description:
      "Lớp tiếng Trung phổ thông và tiếng Trung Đài Loan, phục vụ học viên XKLĐ Đài Loan và du học Trung Quốc/Đài Loan.",
    levels: ["HSK 1 – 2", "HSK 3 – 4", "HSK 5 – 6", "Tiếng Trung giao tiếp Đài Loan"],
    highlights: [
      "Giáo trình HSK Standard Course",
      "Luyện viết chữ Hán & phát âm chuẩn",
      "Lộ trình 6 tháng đạt HSK 4",
      "Hỗ trợ thi HSK quốc tế",
    ],
  },
  "tieng-anh": {
    slug: "tieng-anh",
    name: "Tiếng Anh",
    flag: "🇬🇧",
    tagline: "IELTS, TOEIC & tiếng Anh giao tiếp du học",
    description:
      "Tiếng Anh học thuật và giao tiếp dành cho học viên du học Châu Âu, Bắc Mỹ và môi trường làm việc quốc tế.",
    levels: ["Tiếng Anh giao tiếp A1 – B1", "IELTS 4.5 – 6.5+", "TOEIC 450 – 800+", "Tiếng Anh phỏng vấn visa"],
    highlights: [
      "Giáo viên bản ngữ & Việt Nam IELTS 8.0+",
      "Cam kết đầu ra IELTS theo band",
      "Lớp 4 kỹ năng Nghe – Nói – Đọc – Viết",
      "Mock test định kỳ hàng tháng",
    ],
  },
  "tieng-duc": {
    slug: "tieng-duc",
    name: "Tiếng Đức",
    flag: "🇩🇪",
    tagline: "A1 — B2 Goethe / telc cho điều dưỡng & du học Đức",
    description:
      "Đào tạo tiếng Đức theo chuẩn Goethe-Institut và telc, đặc biệt cho chương trình điều dưỡng và du học nghề Đức.",
    levels: ["A1 – A2 Goethe", "B1 telc / Goethe", "B2 chuyên ngành điều dưỡng", "Luyện phỏng vấn visa Đức"],
    highlights: [
      "Giáo trình Schritte International + Pflege Heute",
      "Giáo viên đã làm việc/học tập tại Đức",
      "Cam kết đầu ra B1/B2 theo lộ trình",
      "Hỗ trợ thi chứng chỉ Goethe / telc",
    ],
  },
};

export const LANGUAGE_LIST = Object.values(LANGUAGE_COURSES);
