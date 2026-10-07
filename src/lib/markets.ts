export type MarketRegion = "asia" | "europe";

export type Market = {
  slug: string;
  name: string;
  flag: string;
  tagline: string;
  description: string;
  highlights: string[];
  region: MarketRegion;
};

export const MARKETS: Record<string, Market> = {
  "nhat-ban": {
    slug: "nhat-ban",
    name: "Nhật Bản",
    flag: "🇯🇵",
    region: "asia",
    tagline: "Đất nước Mặt Trời mọc — kỷ luật, an toàn, thu nhập cao",
    description:
      "Thị trường truyền thống và uy tín nhất của KAIZEN. Cơ hội du học tiếng - chuyên môn và đơn hàng kỹ năng đặc định, thực tập sinh đa dạng ngành.",
    highlights: [
      "Lương cơ bản 30–45 triệu/tháng (chưa tăng ca)",
      "Văn hóa làm việc kỷ luật, môi trường an toàn",
      "Hơn 100 đơn hàng/năm: cơ khí, điện tử, chế biến, điều dưỡng",
      "Hỗ trợ học tiếng Nhật miễn phí trước khi xuất cảnh",
    ],
  },
  "han-quoc": {
    slug: "han-quoc",
    name: "Hàn Quốc",
    flag: "🇰🇷",
    region: "asia",
    tagline: "K-Culture & EPS — cánh cửa thu nhập hấp dẫn",
    description:
      "Chương trình EPS, E7, E9 và du học các trường Top tại Seoul, Busan. Lương cao, cộng đồng người Việt lớn mạnh.",
    highlights: [
      "Thu nhập 35–55 triệu/tháng",
      "Đa dạng visa: EPS, E7, E9, D2/D4 du học",
      "Hỗ trợ học tiếng Hàn TOPIK trước khi đi",
      "Cơ hội định cư dài hạn",
    ],
  },
  "dai-loan": {
    slug: "dai-loan",
    name: "Đài Loan",
    flag: "🇹🇼",
    region: "asia",
    tagline: "Chi phí thấp, đi nhanh, lương ổn định",
    description:
      "Lựa chọn tối ưu cho người lao động muốn xuất cảnh nhanh, chi phí thấp. Nhiều đơn hàng nhà máy điện tử, cơ khí, xây dựng.",
    highlights: [
      "Chi phí xuất cảnh thấp nhất Đông Á",
      "Thời gian chờ chỉ 3–5 tháng",
      "Lương 22–30 triệu/tháng + tăng ca",
      "Tiếng Trung dễ học, văn hóa gần Việt Nam",
    ],
  },
  duc: {
    slug: "duc",
    name: "CHLB Đức",
    flag: "🇩🇪",
    region: "europe",
    tagline: "Điều dưỡng & nghề kép — lộ trình định cư rõ ràng",
    description:
      "Thị trường hàng đầu Châu Âu với chương trình điều dưỡng viên, kỹ thuật viên và du học nghề kép. Mức lương cao, phúc lợi xã hội đầy đủ, cơ hội định cư và bảo lãnh gia đình.",
    highlights: [
      "Lương 50–80 triệu/tháng + phụ cấp",
      "Lộ trình định cư & bảo lãnh gia đình",
      "Bảo hiểm y tế, hưu trí, thất nghiệp đầy đủ",
      "Học tiếng Đức B1/B2 miễn phí trước xuất cảnh",
    ],
  },
  hungary: {
    slug: "hungary",
    name: "Hungary",
    flag: "🇭🇺",
    region: "europe",
    tagline: "Cửa ngõ Trung Âu — chi phí hợp lý, đơn hàng đa dạng",
    description:
      "Thị trường Trung Âu phát triển với nhu cầu tuyển dụng trong sản xuất, chế biến, đầu bếp, dịch vụ. Visa lao động ổn định, môi trường làm việc thân thiện với người Việt.",
    highlights: [
      "Lương 35–55 triệu/tháng",
      "Đơn hàng sản xuất, đầu bếp, chế biến thực phẩm",
      "Chi phí xuất cảnh hợp lý",
      "Cộng đồng người Việt đông đảo, hỗ trợ tốt",
    ],
  },
  "ba-lan": {
    slug: "ba-lan",
    name: "Ba Lan",
    flag: "🇵🇱",
    region: "europe",
    tagline: "Nền kinh tế Châu Âu năng động — nhu cầu lao động lớn",
    description:
      "Một trong những thị trường lao động sôi động nhất EU. Đa dạng đơn hàng sản xuất, kho vận, xây dựng, chế biến thực phẩm. Thủ tục visa nhanh chóng, lộ trình rõ ràng.",
    highlights: [
      "Lương 35–55 triệu/tháng + tăng ca",
      "Đơn hàng sản xuất, logistics, xây dựng",
      "Thời gian visa nhanh 3–6 tháng",
      "Phúc lợi EU đầy đủ",
    ],
  },
  romania: {
    slug: "romania",
    name: "Romania",
    flag: "🇷🇴",
    region: "europe",
    tagline: "Thị trường Châu Âu rộng mở — đa dạng ngành nghề",
    description:
      "Thị trường Châu Âu có nhu cầu lao động trong sản xuất, xây dựng, cơ khí, nông nghiệp và dịch vụ. Visa lao động dài hạn, mức lương cạnh tranh, môi trường an toàn.",
    highlights: [
      "Lương 30–50 triệu/tháng",
      "Đơn hàng đa dạng: sản xuất, xây dựng, nông nghiệp",
      "Chi phí xuất cảnh thấp hơn Tây Âu",
      "Visa lao động dài hạn, dễ gia hạn",
    ],
  },
  slovakia: {
    slug: "slovakia",
    name: "Slovakia",
    flag: "🇸🇰",
    region: "europe",
    tagline: "Thị trường Châu Âu tiềm năng — sản xuất & cơ khí",
    description:
      "Thị trường lao động Châu Âu tiềm năng với nhu cầu tuyển dụng trong các lĩnh vực sản xuất, cơ khí, nhà máy và dịch vụ. Visa Schengen, môi trường công nghiệp hiện đại.",
    highlights: [
      "Lương 35–55 triệu/tháng",
      "Đơn hàng sản xuất, cơ khí, nhà máy",
      "Visa Schengen, di chuyển trong EU",
      "Phúc lợi xã hội đầy đủ theo chuẩn EU",
    ],
  },
  latvia: {
    slug: "latvia",
    name: "Latvia",
    flag: "🇱🇻",
    region: "europe",
    tagline: "Khu vực Baltic — cánh cửa mới sang Châu Âu",
    description:
      "Thị trường thuộc khu vực Baltic, phù hợp với định hướng mở rộng việc làm quốc tế và phát triển nhân lực tại Châu Âu. Môi trường làm việc chuyên nghiệp, an toàn.",
    highlights: [
      "Lương 30–50 triệu/tháng",
      "Đơn hàng sản xuất, dịch vụ, logistics",
      "Visa Schengen toàn khối EU",
      "Cơ hội định cư và phát triển dài hạn",
    ],
  },
  bulgaria: {
    slug: "bulgaria",
    name: "Bulgaria",
    flag: "🇧🇬",
    region: "europe",
    tagline: "Đông Nam Âu — chi phí thấp, cơ hội rộng mở",
    description:
      "Thị trường mới nổi tại Đông Nam Âu với nhu cầu tuyển dụng cao trong sản xuất, dịch vụ, du lịch và nông nghiệp. Chi phí xuất cảnh hợp lý, thủ tục đơn giản.",
    highlights: [
      "Lương 28–45 triệu/tháng",
      "Đơn hàng sản xuất, dịch vụ, du lịch",
      "Chi phí xuất cảnh thấp",
      "Thành viên EU — phúc lợi & di chuyển thuận lợi",
    ],
  },
};

export const MARKET_LIST = Object.values(MARKETS);

export const ASIA_MARKETS = MARKET_LIST.filter((m) => m.region === "asia");
export const EUROPE_MARKETS = MARKET_LIST.filter((m) => m.region === "europe");

// 4 thị trường nổi bật hiển thị trên trang chủ
export const FEATURED_MARKETS: Market[] = [
  MARKETS["nhat-ban"],
  MARKETS["han-quoc"],
  MARKETS["dai-loan"],
  MARKETS["duc"],
];

export const COMPANY = {
  name: "CÔNG TY CỔ PHẦN NHÂN LỰC QUỐC TẾ KAIZEN",
  short: "KAIZEN",
  phone: "0982 943 666",
  phoneRaw: "0982943666",
  email: "kaizen.vh@gmail.com",
  address: "số 36 Nguyễn Thị Định, phường Thành Vinh, Nghệ An",
  hanoiAddress: "" as string,
  taxId: "2901889042",
  slogan: "Vững bước tương lai — Vươn tầm thế giới",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=36+Nguy%E1%BB%85n+Th%E1%BB%8B+%C4%90%E1%BB%8Bnh+Ngh%E1%BB%87+An",
  social: {
    facebook: "https://www.facebook.com/share/1BRP3CZMZD/?mibextid=wwXIfr",
    tiktok: "https://www.tiktok.com/@kaizen_duhoc_xkld",
    youtube:
      "https://www.youtube.com/results?search_query=c%C3%B4ng+ty+c%C3%B4+ph%E1%BA%A7n+nh%C3%A2n+l%C6%B0c+qu%E1%BB%91c+t%E1%BA%BF+kaizen",
    zalo: "https://zalo.me/0982943666",
  },
  hours: {
    weekday: "Thứ 2 – Thứ 7: 08:00 – 17:30",
    sunday: "Chủ nhật: 08:30 – 11:30",
  },
};

