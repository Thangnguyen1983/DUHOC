import japanImg from "@/assets/market-japan.jpg.asset.json";
import koreaImg from "@/assets/market-korea.jpg.asset.json";
import taiwanImg from "@/assets/market-taiwan.jpg.asset.json";
import germanyImg from "@/assets/market-germany.jpg.asset.json";
import globalImg from "@/assets/hero-kaizen-global.jpg.asset.json";

export type XkldStat = { n: string; l: string };
export type XkldJob = { name: string; desc: string };
export type XkldStep = { no: string; title: string; desc: string };
export type XkldFaq = { q: string; a: string };

export type XkldMarketContent = {
  heroImage: string;
  accent: string; // hex color for accent word in H1
  overlay: string; // tailwind gradient classes for overlay
  stats: XkldStat[];
  jobs: XkldJob[];
  requirements: string[];
  costs: { label: string; value: string }[];
  steps: XkldStep[];
  faqs: XkldFaq[];
};

const DEFAULT_STEPS: XkldStep[] = [
  { no: "01", title: "Đăng ký & sơ tuyển", desc: "Tư vấn miễn phí, kiểm tra hồ sơ và định hướng đơn hàng phù hợp." },
  { no: "02", title: "Khám sức khỏe", desc: "Khám tổng quát tại bệnh viện được chỉ định, kết quả trong 3–5 ngày." },
  { no: "03", title: "Học tiếng & định hướng", desc: "Đào tạo ngôn ngữ, văn hóa, kỹ năng nghề trước khi phỏng vấn." },
  { no: "04", title: "Phỏng vấn chủ sử dụng", desc: "Kaizen tổ chức phỏng vấn trực tiếp/online với nhà tuyển dụng." },
  { no: "05", title: "Hoàn thiện hồ sơ & visa", desc: "Xử lý toàn bộ giấy tờ, tư cách lưu trú, xin visa lao động." },
  { no: "06", title: "Xuất cảnh & hỗ trợ", desc: "Đưa tiễn tại sân bay, cán bộ đại diện hỗ trợ tại nước sở tại." },
];

const DEFAULT_REQUIREMENTS = [
  "Độ tuổi 18 – 35 (tùy đơn hàng, một số ngành tới 40)",
  "Sức khỏe tốt, không mắc bệnh thuộc danh mục cấm xuất cảnh",
  "Tốt nghiệp THCS trở lên (một số đơn cần THPT hoặc bằng nghề)",
  "Không tiền án tiền sự, ý thức kỷ luật tốt",
  "Chưa từng bị trục xuất khỏi nước dự kiến làm việc",
];

const DEFAULT_FAQS: XkldFaq[] = [
  { q: "Chi phí xuất cảnh trọn gói bao nhiêu?", a: "Chi phí phụ thuộc từng thị trường và đơn hàng cụ thể — Kaizen công khai bảng chi phí minh bạch trong buổi tư vấn, không thu phí ngoài hợp đồng." },
  { q: "Thời gian từ đăng ký đến xuất cảnh mất bao lâu?", a: "Trung bình 4 – 8 tháng, tùy thị trường: Đài Loan 3–5 tháng, Nhật/Hàn 6–8 tháng, Châu Âu 6–10 tháng." },
  { q: "Không biết tiếng có tham gia được không?", a: "Có. Kaizen tổ chức lớp học tiếng miễn phí/ưu đãi trước khi xuất cảnh, đảm bảo đạt yêu cầu đơn hàng." },
  { q: "Hết hợp đồng có được gia hạn hoặc chuyển công ty?", a: "Được. Tùy visa: kỹ năng đặc định (Nhật), E7/E9 (Hàn), visa lao động EU đều cho phép gia hạn hoặc chuyển chủ hợp pháp." },
  { q: "Kaizen hỗ trợ gì tại nước ngoài?", a: "Có cán bộ đại diện/đối tác tại từng thị trường: đón sân bay, hỗ trợ hồ sơ lưu trú, xử lý phát sinh 24/7." },
  { q: "Rủi ro về sớm hoặc bỏ trốn xử lý thế nào?", a: "Kaizen ký hợp đồng minh bạch theo quy định Bộ LĐTBXH, hoàn phí theo thời gian còn lại; tuyệt đối không dung túng lao động bỏ trốn." },
];

const BASE_STATS: XkldStat[] = [
  { n: "3.000+", l: "Lao động xuất cảnh" },
  { n: "98%", l: "Tỷ lệ đậu visa" },
  { n: "10", l: "Quốc gia đối tác" },
  { n: "15+", l: "Năm kinh nghiệm" },
];

const DEFAULT_JOBS: XkldJob[] = [
  { name: "Chế tạo — cơ khí", desc: "Vận hành máy CNC, hàn, lắp ráp linh kiện điện tử." },
  { name: "Xây dựng", desc: "Cốp pha, giàn giáo, hoàn thiện nội thất, lắp đặt ống nước." },
  { name: "Chế biến thực phẩm", desc: "Đóng gói, sơ chế, kiểm phẩm dây chuyền sản xuất." },
  { name: "Điều dưỡng & hộ lý", desc: "Chăm sóc người cao tuổi tại viện dưỡng lão, bệnh viện." },
];

export const XKLD_MARKET_CONTENT: Record<string, XkldMarketContent> = {
  "nhat-ban": {
    heroImage: japanImg.url,
    accent: "#ffd2d4",
    overlay: "bg-gradient-to-r from-[#0f172a]/85 via-[#0f172a]/60 to-[#0f172a]/25",
    stats: [
      { n: "100+", l: "Đơn hàng / năm" },
      { n: "30–45tr", l: "Lương cơ bản/tháng" },
      { n: "15+", l: "Năm hợp tác Nhật" },
      { n: "98%", l: "Tỷ lệ đậu visa" },
    ],
    jobs: [
      { name: "Kỹ năng đặc định — Chế tạo", desc: "Cơ khí, hàn, đúc, gia công kim loại — lương 32–42 triệu." },
      { name: "Thực tập sinh Điện tử", desc: "Lắp ráp linh kiện, kiểm tra bo mạch — làm việc trong nhà máy hiện đại." },
      { name: "Điều dưỡng — Hộ lý (Kaigo)", desc: "Chăm sóc người cao tuổi tại viện dưỡng lão, cơ hội gia hạn 5 năm." },
      { name: "Chế biến thực phẩm", desc: "Nhà máy cơm hộp, hải sản, bánh kẹo — công việc ổn định, tăng ca đều." },
    ],
    requirements: [
      "Nam/Nữ 18 – 35 tuổi, cao 1m58/1m50 trở lên",
      "Tốt nghiệp THPT hoặc THCS + bằng nghề",
      "Không xăm mình vị trí lộ ra ngoài",
      "Sức khỏe tốt, không mắc bệnh truyền nhiễm",
    ],
    costs: [
      { label: "Chi phí xuất cảnh trọn gói", value: "120 – 170 triệu VNĐ" },
      { label: "Học phí tiếng Nhật N4/N5", value: "Miễn phí / trợ giá" },
      { label: "Vé máy bay 1 chiều", value: "8 – 12 triệu" },
      { label: "Phí dịch vụ Kaizen", value: "Theo quy định Bộ LĐTBXH" },
    ],
    steps: DEFAULT_STEPS,
    faqs: DEFAULT_FAQS,
  },
  "han-quoc": {
    heroImage: koreaImg.url,
    accent: "#ffd2d4",
    overlay: "bg-gradient-to-r from-[#0f172a]/85 via-[#0f172a]/60 to-[#0f172a]/25",
    stats: [
      { n: "35–55tr", l: "Lương/tháng" },
      { n: "800+", l: "Lao động đã đi Hàn" },
      { n: "EPS/E7/E9", l: "Đa dạng visa" },
      { n: "15+", l: "Năm kinh nghiệm" },
    ],
    jobs: [
      { name: "EPS — Sản xuất chế tạo", desc: "Nhà máy điện tử, ô tô, đóng tàu — lương 40–55 triệu/tháng." },
      { name: "E9 — Nông nghiệp / ngư nghiệp", desc: "Trang trại rau củ, chăn nuôi, đánh bắt hải sản — bao ăn ở." },
      { name: "E7 — Kỹ thuật viên", desc: "Kỹ sư IT, cơ khí, đóng tàu có bằng ĐH — lương 55–80 triệu." },
      { name: "Xây dựng", desc: "Thi công công trình, hoàn thiện — thu nhập cao mùa cao điểm." },
    ],
    requirements: [
      "Nam/Nữ 18 – 39 tuổi",
      "Không tiền án tiền sự",
      "TOPIK 1 trở lên (Kaizen hỗ trợ luyện thi)",
      "Sức khỏe đạt yêu cầu HRD Korea",
    ],
    costs: [
      { label: "Chi phí trọn gói", value: "100 – 150 triệu VNĐ" },
      { label: "Luyện thi TOPIK", value: "Ưu đãi cho học viên Kaizen" },
      { label: "Vé máy bay", value: "5 – 8 triệu" },
      { label: "Phí dịch vụ", value: "Theo quy định pháp luật" },
    ],
    steps: DEFAULT_STEPS,
    faqs: DEFAULT_FAQS,
  },
  "dai-loan": {
    heroImage: taiwanImg.url,
    accent: "#ffd2d4",
    overlay: "bg-gradient-to-r from-[#0f172a]/85 via-[#0f172a]/60 to-[#0f172a]/25",
    stats: [
      { n: "3–5 tháng", l: "Thời gian xuất cảnh" },
      { n: "22–30tr", l: "Lương cơ bản/tháng" },
      { n: "500+", l: "Đơn hàng/năm" },
      { n: "Chi phí thấp", l: "Nhất Đông Á" },
    ],
    jobs: [
      { name: "Nhà máy điện tử", desc: "Foxconn, Compal, Pegatron — dây chuyền lắp ráp hiện đại." },
      { name: "Cơ khí — hàn xì", desc: "Nhà máy sản xuất linh kiện, ô tô, xe máy." },
      { name: "Xây dựng", desc: "Công trình dân dụng, cao ốc tại Đài Bắc, Cao Hùng." },
      { name: "Giúp việc gia đình / chăm sóc", desc: "Đơn hàng ổn định, ở cùng chủ, chi phí sinh hoạt thấp." },
    ],
    requirements: [
      "Nam/Nữ 20 – 40 tuổi",
      "Cao 1m60/1m50 trở lên",
      "Tốt nghiệp THCS trở lên",
      "Sức khỏe tốt, không xăm hình lộ ra ngoài",
    ],
    costs: [
      { label: "Chi phí trọn gói", value: "70 – 110 triệu VNĐ" },
      { label: "Học tiếng Trung", value: "Miễn phí / trợ giá" },
      { label: "Vé máy bay", value: "4 – 6 triệu" },
      { label: "Phí dịch vụ", value: "Theo hợp đồng minh bạch" },
    ],
    steps: DEFAULT_STEPS,
    faqs: DEFAULT_FAQS,
  },
  duc: {
    heroImage: germanyImg.url,
    accent: "#FFCC00",
    overlay: "bg-gradient-to-r from-[#1a1a1a]/85 via-[#7a1419]/55 to-[#c9a227]/30",
    stats: [
      { n: "50–80tr", l: "Lương/tháng" },
      { n: "5 năm", l: "Đủ điều kiện định cư" },
      { n: "B1/B2", l: "Đào tạo tiếng Đức" },
      { n: "Bảo lãnh", l: "Vợ/chồng & con" },
    ],
    jobs: [
      { name: "Điều dưỡng viên", desc: "Bệnh viện, viện dưỡng lão — lương 2.400–3.200 EUR/tháng." },
      { name: "Đầu bếp — nhà hàng", desc: "Nhà hàng Á/Âu — hợp đồng dài hạn, phụ cấp ăn ở." },
      { name: "Kỹ thuật viên cơ khí / điện", desc: "Công ty sản xuất Đức — chuẩn hóa tay nghề châu Âu." },
      { name: "Xây dựng — lắp đặt", desc: "Thợ hàn, điện nước, hoàn thiện — nhu cầu rất lớn." },
    ],
    requirements: [
      "18 – 35 tuổi, tốt nghiệp THPT trở lên",
      "Tiếng Đức B1 (Kaizen đào tạo trọn gói)",
      "Sức khỏe tốt, không tiền án",
      "Có bằng nghề/điều dưỡng là lợi thế",
    ],
    costs: [
      { label: "Chi phí trọn gói", value: "250 – 350 triệu VNĐ" },
      { label: "Đào tạo tiếng Đức B1", value: "Tính trong gói dịch vụ" },
      { label: "Vé máy bay", value: "18 – 25 triệu" },
      { label: "Phí visa quốc gia", value: "75 EUR" },
    ],
    steps: DEFAULT_STEPS,
    faqs: DEFAULT_FAQS,
  },
};

export function getXkldContent(slug: string): XkldMarketContent {
  return (
    XKLD_MARKET_CONTENT[slug] ?? {
      heroImage: germanyImg.url,
      accent: "#ffd2d4",
      overlay: "bg-gradient-to-r from-[#0f172a]/85 via-[#0f172a]/60 to-[#0f172a]/25",
      stats: BASE_STATS,
      jobs: DEFAULT_JOBS,
      requirements: DEFAULT_REQUIREMENTS,
      costs: [
        { label: "Chi phí trọn gói", value: "180 – 260 triệu VNĐ" },
        { label: "Đào tạo ngôn ngữ", value: "Tính trong gói dịch vụ" },
        { label: "Vé máy bay", value: "15 – 22 triệu" },
        { label: "Phí dịch vụ", value: "Theo quy định Bộ LĐTBXH" },
      ],
      steps: DEFAULT_STEPS,
      faqs: DEFAULT_FAQS,
    }
  );
}

export const XKLD_INDEX_HERO_IMAGE = globalImg.url;
