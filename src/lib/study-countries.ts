import ducHeroImage from "@/assets/DH_NGHE_DUC.jpg.asset.json";

export type StudyProgram = {
  slug: string;
  name: string;
  desc: string;
};

export type StudyCountry = {
  slug: string;
  name: string;
  flag: string;
  shortName: string; // for menu, e.g. "Hàn Quốc"
  tagline: string;
  description: string;
  heroImage: string; // background gradient/photo URL
  accent: string; // tailwind gradient classes for hero overlay
  programs: StudyProgram[];
  costs: { label: string; value: string }[];
  requirements: string[];
  scholarships: string[];
  visa: { step: string; detail: string }[];
};

// Hero background photos from Unsplash (free, hotlink-allowed).
const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1920&q=80`;

export const STUDY_COUNTRIES: Record<string, StudyCountry> = {
  "han-quoc": {
    slug: "han-quoc",
    shortName: "Hàn Quốc",
    name: "Hàn Quốc",
    flag: "🇰🇷",
    tagline: "K-Education — học bổng lớn, cộng đồng Việt mạnh",
    description:
      "Hệ thống đại học top châu Á (SKY, KAIST, POSTECH), học bổng GKS lên tới 100% học phí, cơ hội làm thêm 20h/tuần và ở lại làm việc sau tốt nghiệp.",
    heroImage: img("photo-1538485399081-7c8970e22338"),
    accent: "from-[#0f172a]/80 via-[#0f172a]/55 to-transparent",
    programs: [
      { slug: "tieng-han", name: "Du học tiếng Hàn", desc: "Khóa tiếng 6 tháng – 2 năm tại trường đại học chính quy." },
      { slug: "dai-hoc", name: "Du học Đại học", desc: "Hệ cử nhân 4 năm — SKY, Hanyang, Kyung Hee, Chung-Ang…" },
      { slug: "thac-si", name: "Du học Thạc sĩ", desc: "MA/MS 2 năm, học bổng GKS, BK21 dành cho sinh viên xuất sắc." },
      { slug: "hoc-bong", name: "Học bổng Hàn Quốc", desc: "GKS, học bổng trường 30–100%, trợ cấp sinh hoạt." },
      { slug: "visa", name: "Visa du học Hàn Quốc", desc: "D-2, D-4: hồ sơ trọn gói, tỉ lệ đậu cao." },
    ],
    costs: [
      { label: "Học phí/năm", value: "60 – 120 triệu VNĐ" },
      { label: "Sinh hoạt phí/tháng", value: "10 – 15 triệu VNĐ" },
      { label: "Chứng minh tài chính", value: "≈ 20.000 USD" },
      { label: "Phí dịch vụ KAIZEN", value: "Tư vấn miễn phí" },
    ],
    requirements: [
      "Tốt nghiệp THPT, GPA ≥ 6.5",
      "TOPIK 2 trở lên (hoặc cam kết học tiếng tại Hàn)",
      "Hồ sơ tài chính minh bạch",
      "Sức khoẻ tốt, không tiền án tiền sự",
    ],
    scholarships: [
      "GKS (Global Korea Scholarship) — toàn phần",
      "Học bổng trường 30 – 100% học phí",
      "Học bổng tỉnh Gyeonggi, Busan, Seoul",
      "Hỗ trợ vé máy bay & ký túc xá năm đầu",
    ],
    visa: [
      { step: "D-4", detail: "Visa học tiếng Hàn 6 tháng – 2 năm." },
      { step: "D-2", detail: "Visa hệ cao đẳng, đại học, thạc sĩ, tiến sĩ." },
      { step: "Hồ sơ", detail: "COE từ trường, chứng minh tài chính, học bạ, bằng cấp." },
      { step: "Thời gian", detail: "Xử lý 2 – 4 tuần tại LSQ Hàn Quốc." },
    ],
  },
  "dai-loan": {
    slug: "dai-loan",
    shortName: "Đài Loan",
    name: "Đài Loan",
    flag: "🇹🇼",
    tagline: "Chi phí thấp, học bổng cao, vừa học vừa làm",
    description:
      "Bằng cấp được công nhận quốc tế, học phí chỉ bằng 1/3 châu Âu. Chương trình hệ vừa học vừa làm thu nhập 18 – 25 triệu/tháng, lộ trình định cư rõ ràng.",
    heroImage: img("photo-1470004914212-05527e49370b"),
    accent: "from-[#0a3d2a]/80 via-[#0a3d2a]/45 to-transparent",
    programs: [
      { slug: "vua-hoc-vua-lam", name: "Hệ vừa học vừa làm", desc: "Học 2 ngày, làm 5 ngày — lương 18–25 triệu/tháng." },
      { slug: "chinh-quy", name: "Hệ chính quy", desc: "Đại học, thạc sĩ chính quy — bằng quốc tế." },
      { slug: "hoc-bong", name: "Học bổng Đài Loan", desc: "MOE Taiwan Scholarship, ICDF, học bổng trường." },
      { slug: "visa", name: "Visa du học Đài Loan", desc: "Visa Resident — hồ sơ đơn giản, xử lý nhanh." },
    ],
    costs: [
      { label: "Học phí/năm", value: "40 – 70 triệu VNĐ" },
      { label: "Sinh hoạt phí/tháng", value: "7 – 10 triệu VNĐ" },
      { label: "Thu nhập làm thêm", value: "18 – 25 triệu/tháng" },
      { label: "Chi phí trọn gói", value: "120 – 180 triệu VNĐ" },
    ],
    requirements: [
      "Tốt nghiệp THPT, GPA ≥ 6.0",
      "TOCFL A2 hoặc cam kết học tiếng",
      "Tuổi 18 – 30",
      "Sức khoẻ tốt",
    ],
    scholarships: [
      "MOE Taiwan Scholarship — toàn phần",
      "ICDF Scholarship cho thạc sĩ/tiến sĩ",
      "Học bổng trường giảm 30 – 100% học phí",
      "Trợ cấp sinh hoạt 250 – 700 USD/tháng",
    ],
    visa: [
      { step: "Resident Visa", detail: "Cho du học sinh hệ dài hạn (≥6 tháng)." },
      { step: "ARC", detail: "Thẻ cư trú đăng ký sau khi nhập cảnh." },
      { step: "Hồ sơ", detail: "Thư mời nhập học, chứng minh tài chính 5.000 USD." },
      { step: "Thời gian", detail: "Xử lý 1 – 2 tuần tại Văn phòng Kinh tế Văn hoá Đài Bắc." },
    ],
  },
  "nhat-ban": {
    slug: "nhat-ban",
    shortName: "Nhật Bản",
    name: "Nhật Bản",
    flag: "🇯🇵",
    tagline: "Cường quốc giáo dục — kỷ luật, chất lượng, cơ hội",
    description:
      "Hệ thống giáo dục đứng top 5 thế giới với 700+ trường đại học. MEXT Scholarship toàn phần, làm thêm 28h/tuần, lộ trình ở lại làm việc và định cư rõ ràng.",
    heroImage: img("photo-1492571350019-22de08371fd3"),
    accent: "from-[#7a1419]/80 via-[#7a1419]/45 to-transparent",
    programs: [
      { slug: "tieng-nhat", name: "Du học tiếng Nhật", desc: "Khóa Nhật ngữ 1 – 2 năm tại Tokyo, Osaka, Fukuoka." },
      { slug: "truong-nhat-ngu", name: "Trường Nhật ngữ", desc: "Hơn 400 trường Nhật ngữ uy tín, đối tác KAIZEN." },
      { slug: "dai-hoc-cao-dang", name: "Đại học và Cao đẳng", desc: "Hệ cử nhân, senmon — bằng cấp quốc tế." },
      { slug: "hoc-bong", name: "Học bổng Nhật Bản", desc: "MEXT, JASSO, học bổng trường 30 – 100%." },
      { slug: "visa", name: "Visa du học Nhật Bản", desc: "COE từ Cục Xuất nhập cảnh — tỉ lệ đậu 95%+." },
    ],
    costs: [
      { label: "Học phí/năm", value: "120 – 180 triệu VNĐ" },
      { label: "Sinh hoạt phí/tháng", value: "15 – 20 triệu VNĐ" },
      { label: "Thu nhập làm thêm", value: "20 – 35 triệu/tháng" },
      { label: "Chứng minh tài chính", value: "≈ 500 triệu VNĐ" },
    ],
    requirements: [
      "Tốt nghiệp THPT, GPA ≥ 6.5",
      "JLPT N5 trở lên (N4 ưu tiên)",
      "Tuổi 18 – 30, hạnh kiểm tốt",
      "Hồ sơ tài chính rõ ràng",
    ],
    scholarships: [
      "MEXT Scholarship — toàn phần (~150.000 yên/tháng)",
      "JASSO Honors — 48.000 yên/tháng",
      "Học bổng trường giảm 30 – 100% học phí",
      "Học bổng địa phương Tokyo, Osaka, Hokkaido",
    ],
    visa: [
      { step: "COE", detail: "Giấy chứng nhận tư cách lưu trú từ Cục XNC Nhật Bản." },
      { step: "Visa Student", detail: "Cấp tại Đại sứ quán Nhật sau khi có COE." },
      { step: "Hồ sơ", detail: "Bằng cấp, chứng chỉ JLPT, chứng minh tài chính." },
      { step: "Thời gian", detail: "Tổng quy trình 3 – 6 tháng trước kỳ nhập học." },
    ],
  },
  duc: {
    slug: "duc",
    shortName: "CHLB Đức",
    name: "CHLB Đức",
    flag: "🇩🇪",
    tagline: "Học MIỄN PHÍ — chất lượng top châu Âu",
    description:
      "Đại học công lập Đức miễn học phí cho cả sinh viên quốc tế. Du học nghề Đức nhận lương 950 – 1.300 EUR/tháng ngay khi học. Lộ trình định cư sau 5 năm.",
    heroImage: ducHeroImage.url,
    accent: "from-[#1a1a1a]/80 via-[#7a1419]/40 to-[#c9a227]/30",
    programs: [
      { slug: "du-hoc-nghe", name: "Du học nghề Đức", desc: "Ausbildung 3 năm — lương 950 – 1.300 EUR/tháng." },
      { slug: "dai-hoc", name: "Đại học Đức", desc: "Cử nhân, thạc sĩ tại 400+ đại học công lập miễn phí." },
      { slug: "du-bi-dai-hoc", name: "Dự bị Đại học (Studienkolleg)", desc: "Khoá dự bị 1 năm cho HS tốt nghiệp THPT VN." },
      { slug: "tieng-duc", name: "Chứng chỉ tiếng Đức", desc: "A1 – C1 đạt chuẩn Goethe / telc / ÖSD." },
      { slug: "visa", name: "Visa Đức", desc: "Visa du học, du học nghề — quy trình minh bạch." },
    ],
    costs: [
      { label: "Học phí đại học", value: "MIỄN PHÍ (trường công)" },
      { label: "Sinh hoạt phí/tháng", value: "850 – 1.100 EUR" },
      { label: "Phí semester", value: "150 – 350 EUR/kỳ" },
      { label: "Tài khoản phong tỏa", value: "11.904 EUR/năm" },
    ],
    requirements: [
      "Tốt nghiệp THPT, điểm thi ĐH ≥ 24 (hoặc đỗ ĐH chính quy)",
      "Tiếng Đức B1 (nghề) / B2 – C1 (đại học)",
      "Tài khoản phong tỏa 11.904 EUR",
      "Bảo hiểm y tế quốc tế",
    ],
    scholarships: [
      "DAAD Scholarship — toàn phần thạc sĩ/tiến sĩ",
      "Deutschlandstipendium — 300 EUR/tháng",
      "Học bổng Erasmus+ liên kết trường",
      "Học bổng riêng từng bang",
    ],
    visa: [
      { step: "Visa du học", detail: "Cấp tại ĐSQ Đức Hà Nội / TLSQ TP.HCM." },
      { step: "Visa Ausbildung", detail: "Cho học viên có hợp đồng đào tạo nghề." },
      { step: "Hồ sơ", detail: "Thư mời, bảng điểm, chứng chỉ tiếng, tài khoản phong tỏa." },
      { step: "Thời gian", detail: "Xử lý 6 – 12 tuần — đặt lịch ĐSQ sớm." },
    ],
  },
  canada: {
    slug: "canada",
    shortName: "Canada",
    name: "Canada",
    flag: "🇨🇦",
    tagline: "Giáo dục đẳng cấp — lộ trình định cư PR rõ ràng",
    description:
      "Quốc gia hàng đầu về chất lượng sống. Bằng cấp quốc tế, được làm thêm 24h/tuần, PGWP 1–3 năm sau tốt nghiệp, lộ trình định cư Express Entry / PNP.",
    heroImage: img("photo-1503614472-8c93d56e92ce"),
    accent: "from-[#7a1419]/75 via-[#7a1419]/40 to-transparent",
    programs: [
      { slug: "trung-hoc", name: "Trung học", desc: "Hệ public & private từ lớp 7 – 12." },
      { slug: "cao-dang", name: "Cao đẳng", desc: "Diploma 1 – 3 năm — thực tập có lương." },
      { slug: "dai-hoc", name: "Đại học", desc: "Bachelor 3 – 4 năm tại U15, top QS thế giới." },
      { slug: "sau-dai-hoc", name: "Sau đại học", desc: "Master, PhD, Post-Graduate Certificate." },
      { slug: "visa", name: "Visa du học Canada", desc: "Study Permit + SDS — xử lý nhanh, tỉ lệ đậu cao." },
    ],
    costs: [
      { label: "Học phí/năm", value: "15.000 – 35.000 CAD" },
      { label: "Sinh hoạt phí/năm", value: "12.000 – 15.000 CAD" },
      { label: "GIC bắt buộc", value: "20.635 CAD" },
      { label: "Thu nhập làm thêm", value: "16 – 22 CAD/giờ" },
    ],
    requirements: [
      "Tốt nghiệp THPT, GPA ≥ 7.0",
      "IELTS 6.0 (UG) / 6.5 (PG)",
      "Chứng minh tài chính + GIC",
      "Khám sức khoẻ tại bệnh viện được chỉ định",
    ],
    scholarships: [
      "Vanier Canada Graduate Scholarship",
      "Học bổng trường 5.000 – 30.000 CAD",
      "Học bổng tỉnh bang Ontario, BC",
      "Hỗ trợ TA/RA cho hệ sau đại học",
    ],
    visa: [
      { step: "SDS", detail: "Study Direct Stream — xử lý ưu tiên cho hồ sơ Việt Nam." },
      { step: "Study Permit", detail: "Cấp cho khoá học ≥ 6 tháng." },
      { step: "Hồ sơ", detail: "LOA, GIC, IELTS 6.0+, học bạ, sức khoẻ, sinh trắc học." },
      { step: "Thời gian", detail: "SDS xử lý 3 – 8 tuần." },
    ],
  },
  uc: {
    slug: "uc",
    shortName: "Úc",
    name: "Úc",
    flag: "🇦🇺",
    tagline: "Giáo dục top thế giới — môi trường đa văn hoá",
    description:
      "Group of Eight (Go8) thuộc top 50 thế giới. Sinh viên được làm thêm 48h/2 tuần, visa 485 sau tốt nghiệp 2 – 6 năm, lộ trình định cư qua Skilled Migration.",
    heroImage: img("photo-1523482580672-f109ba8cb9be"),
    accent: "from-[#0a2540]/80 via-[#0a2540]/45 to-transparent",
    programs: [
      { slug: "trung-hoc", name: "Trung học", desc: "Year 7 – 12 tại NSW, VIC, QLD." },
      { slug: "dai-hoc", name: "Đại học", desc: "Bachelor 3 năm tại Go8 và 43 ĐH công lập." },
      { slug: "thac-si", name: "Thạc sĩ", desc: "Master 1.5 – 2 năm + visa 485 ở lại làm việc." },
      { slug: "hoc-bong", name: "Học bổng Úc", desc: "Australia Awards, học bổng trường 25 – 100%." },
      { slug: "visa", name: "Visa du học Úc", desc: "Subclass 500 — xử lý 4 – 8 tuần." },
    ],
    costs: [
      { label: "Học phí/năm", value: "25.000 – 45.000 AUD" },
      { label: "Sinh hoạt phí/năm", value: "24.505 AUD (chuẩn DoHA)" },
      { label: "OSHC bảo hiểm", value: "500 – 700 AUD/năm" },
      { label: "Thu nhập làm thêm", value: "23 – 28 AUD/giờ" },
    ],
    requirements: [
      "Tốt nghiệp THPT, GPA ≥ 7.0",
      "IELTS 6.0 (UG) / 6.5 (PG)",
      "Chứng minh tài chính theo DoHA",
      "GTE Statement (Genuine Temporary Entrant)",
    ],
    scholarships: [
      "Australia Awards Scholarship — toàn phần",
      "Destination Australia — 15.000 AUD/năm",
      "Học bổng trường 25 – 100% học phí",
      "Học bổng nghiên cứu RTP cho PhD",
    ],
    visa: [
      { step: "Subclass 500", detail: "Visa du học sinh chính." },
      { step: "Subclass 485", detail: "Visa ở lại làm việc 2 – 6 năm sau tốt nghiệp." },
      { step: "Hồ sơ", detail: "CoE, OSHC, IELTS, GTE, chứng minh tài chính." },
      { step: "Thời gian", detail: "Xử lý 4 – 8 tuần qua ImmiAccount." },
    ],
  },
  anh: {
    slug: "anh",
    shortName: "Anh Quốc",
    name: "Vương quốc Anh",
    flag: "🇬🇧",
    tagline: "Cái nôi giáo dục thế giới — Oxford, Cambridge, Russell Group",
    description:
      "Bằng cấp danh giá, thời gian học rút gọn (BA 3 năm, MA 1 năm). Graduate Route Visa cho phép ở lại 2 – 3 năm làm việc sau tốt nghiệp.",
    heroImage: img("photo-1486299267070-83823f5448dd"),
    accent: "from-[#0a1a3a]/80 via-[#0a1a3a]/45 to-transparent",
    programs: [
      { slug: "a-level", name: "A-Level", desc: "Dự bị đại học 2 năm cho HS quốc tế." },
      { slug: "dai-hoc", name: "Đại học", desc: "Bachelor 3 năm tại Russell Group, Oxbridge." },
      { slug: "thac-si", name: "Thạc sĩ", desc: "Master 1 năm — bằng quốc tế, tiết kiệm chi phí." },
      { slug: "hoc-bong", name: "Học bổng Anh", desc: "Chevening, GREAT, học bổng trường 30 – 100%." },
      { slug: "visa", name: "Visa du học Anh", desc: "Student Route — xử lý 3 tuần." },
    ],
    costs: [
      { label: "Học phí/năm", value: "15.000 – 35.000 GBP" },
      { label: "Sinh hoạt phí/năm", value: "12.000 – 15.000 GBP" },
      { label: "IHS bảo hiểm", value: "776 GBP/năm" },
      { label: "Phí visa", value: "490 GBP" },
    ],
    requirements: [
      "Tốt nghiệp THPT (UG) / Cử nhân (PG)",
      "IELTS 6.0 – 6.5 / UKVI",
      "CAS từ trường được Home Office cấp phép",
      "Chứng minh tài chính 28 ngày",
    ],
    scholarships: [
      "Chevening Scholarship — toàn phần thạc sĩ",
      "GREAT Scholarships — 10.000 GBP",
      "Học bổng Commonwealth cho PhD",
      "Học bổng trường 30 – 100% học phí",
    ],
    visa: [
      { step: "Student Route", detail: "Visa cho khoá học ≥ 6 tháng." },
      { step: "Graduate Route", detail: "Ở lại 2 – 3 năm sau tốt nghiệp." },
      { step: "Hồ sơ", detail: "CAS, IELTS UKVI, tài chính, ATAS (nếu cần)." },
      { step: "Thời gian", detail: "Xử lý 3 tuần, ưu tiên 5 ngày làm việc." },
    ],
  },
  my: {
    slug: "my",
    shortName: "Mỹ",
    name: "Hoa Kỳ",
    flag: "🇺🇸",
    tagline: "Hệ thống giáo dục số 1 thế giới — 8 Ivy League",
    description:
      "Hơn 4.000 trường đại học, đa dạng chuyên ngành. Cơ hội OPT 12 – 36 tháng làm việc sau tốt nghiệp, H1B chuyển định cư diện EB.",
    heroImage: img("photo-1485738422979-f5c462d49f74"),
    accent: "from-[#0a1f4a]/80 via-[#7a1419]/35 to-transparent",
    programs: [
      { slug: "trung-hoc", name: "Trung học Mỹ", desc: "High school public exchange & private boarding." },
      { slug: "cao-dang-cong-dong", name: "Cao đẳng cộng đồng", desc: "2+2 — tiết kiệm 50% học phí 2 năm đầu." },
      { slug: "dai-hoc", name: "Đại học Mỹ", desc: "Bachelor 4 năm tại Ivy League, top 100 QS." },
      { slug: "thac-si", name: "Thạc sĩ", desc: "MS/MBA 1 – 2 năm, OPT STEM 36 tháng." },
      { slug: "visa-f1", name: "Visa F1", desc: "Visa du học sinh non-immigrant — phỏng vấn LSQ." },
    ],
    costs: [
      { label: "Học phí/năm", value: "20.000 – 60.000 USD" },
      { label: "Sinh hoạt phí/năm", value: "12.000 – 18.000 USD" },
      { label: "SEVIS fee", value: "350 USD" },
      { label: "Phí visa F1", value: "185 USD" },
    ],
    requirements: [
      "Tốt nghiệp THPT, GPA ≥ 7.5",
      "IELTS 6.5 / TOEFL 80+ / Duolingo 110+",
      "SAT/ACT (UG) hoặc GRE/GMAT (PG)",
      "Chứng minh tài chính rõ ràng cho I-20",
    ],
    scholarships: [
      "Fulbright — toàn phần thạc sĩ/tiến sĩ",
      "Need-based aid tại các trường Ivy",
      "Học bổng merit 10.000 – 50.000 USD/năm",
      "Học bổng thể thao, nghệ thuật (NCAA)",
    ],
    visa: [
      { step: "I-20", detail: "Trường cấp sau khi nhập học & chứng minh tài chính." },
      { step: "DS-160 + SEVIS", detail: "Khai DS-160, đóng phí SEVIS 350 USD." },
      { step: "Phỏng vấn F1", detail: "Tại LSQ Hà Nội / TP.HCM — đậu ngay trong ngày." },
      { step: "Thời gian", detail: "Toàn bộ quy trình 2 – 4 tháng trước nhập học." },
    ],
  },
};

export const STUDY_COUNTRY_LIST = Object.values(STUDY_COUNTRIES);
