/**
 * Dữ liệu Du học Hàn Quốc — chuẩn hoá theo cấu trúc `du-hoc-duc.ts`
 * để trang `/du-hoc/han-quoc` cùng form với Đức / Đài Loan / Nhật Bản.
 */

export const HAN_IMG = {
  hero: "https://images.unsplash.com/photo-1538485399081-7c8970e22338?auto=format&fit=crop&w=1920&q=80",
  campus: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
  seoul: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=1200&q=80",
  visa: "https://images.unsplash.com/photo-1580974852861-c381510bc98a?auto=format&fit=crop&w=1200&q=80",
  student: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  lamthem: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
  khaigiang: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
};

export const HAN_STATS = [
  { label: "Học phí/năm", value: "120 – 200 triệu VNĐ" },
  { label: "Sinh hoạt phí/tháng", value: "12 – 18 triệu VNĐ" },
  { label: "Thu nhập làm thêm", value: "15 – 25 triệu/tháng" },
  { label: "Chứng minh tài chính", value: "≈ 220 triệu VNĐ" },
];

export const HAN_WHY = [
  {
    title: "Học bổng GKS 100% từ Chính phủ",
    desc: "Chương trình Global Korea Scholarship (GKS) tài trợ toàn phần học phí + sinh hoạt phí + vé máy bay cho sinh viên xuất sắc. Kaizen hỗ trợ săn học bổng phù hợp năng lực từng học viên.",
  },
  {
    title: "Làm thêm 20h/tuần hợp pháp",
    desc: "Sau 6 tháng đầu, du học sinh được phép làm thêm 20h/tuần trong kỳ và không giới hạn kỳ nghỉ. Lương tối thiểu 2026: 9.860 KRW/giờ — đủ chi trả sinh hoạt phí hàng tháng.",
  },
  {
    title: "Lộ trình định cư F-2 / F-5 rõ ràng",
    desc: "Sau tốt nghiệp → visa D-10 tìm việc 6 tháng → E-7 làm chuyên ngành → F-2 (cư trú dài hạn) sau 3–5 năm → F-5 (định cư vĩnh viễn). Lộ trình minh bạch, có sẵn khung pháp lý.",
  },
  {
    title: "Gần Việt Nam — bay thẳng 4h30",
    desc: "Bay thẳng Hà Nội / TP.HCM ↔ Seoul chỉ 4h30, vé phổ thông từ 5 triệu/lượt. Về thăm nhà dịp Tết, lễ dễ dàng — điều mà du học Âu/Mỹ khó có được.",
  },
  {
    title: "Văn hoá K-Wave & môi trường năng động",
    desc: "K-pop, K-drama, ẩm thực Hàn — môi trường sống trẻ trung, hiện đại. Cộng đồng du học sinh Việt tại Seoul, Busan, Daegu đông đảo, hỗ trợ nhau khi mới sang.",
  },
  {
    title: "Bằng cấp top châu Á, công nhận toàn cầu",
    desc: "Hàn Quốc có 5 trường trong top 100 QS World: SNU, KAIST, Yonsei, Korea University, POSTECH. Bằng cấp được công nhận tại Mỹ, EU, ASEAN — mở đường sự nghiệp toàn cầu.",
  },
];

export const HAN_PROGRAMS = [
  {
    slug: "d4-tieng-han",
    visa: "D-4",
    name: "Du học tiếng Hàn",
    image: HAN_IMG.campus,
    duration: "6 – 24 tháng",
    cost: "120 – 180 triệu/năm",
    hot: true,
    desc: "Học tiếng Hàn tại trung tâm ngôn ngữ của các trường đại học. Sau khi đạt TOPIK 3 chuyển sang D-2 học chính quy. Phù hợp bạn chưa có tiếng Hàn.",
    bullets: [
      "Không yêu cầu TOPIK khi apply",
      "Gia hạn 6 tháng/lần, tối đa 2 năm",
      "Được làm thêm sau 6 tháng đầu",
    ],
  },
  {
    slug: "d2-dai-hoc",
    visa: "D-2-2",
    name: "Du học Đại học chính quy",
    image: HAN_IMG.student,
    duration: "4 năm",
    cost: "200 – 320 triệu/năm",
    hot: true,
    desc: "Hệ cử nhân tại các đại học Hàn Quốc: SKY, Hanyang, Kyung Hee, Chung-Ang, Soonchunhyang... Đa dạng ngành từ kinh tế, kỹ thuật đến nghệ thuật.",
    bullets: [
      "Yêu cầu TOPIK 3 trở lên hoặc IELTS 5.5",
      "Học bổng trường 30 – 100% học phí",
      "Chuyển tiếp thạc sĩ / định cư F-2 thuận lợi",
    ],
  },
  {
    slug: "gks-thac-si",
    visa: "GKS",
    name: "Thạc sĩ / Tiến sĩ học bổng GKS",
    image: HAN_IMG.khaigiang,
    duration: "2 – 4 năm",
    cost: "Toàn phần",
    desc: "Học bổng Chính phủ Hàn Quốc GKS: học phí + 900.000 KRW/tháng sinh hoạt + vé máy bay + bảo hiểm. Chương trình danh giá bậc nhất châu Á.",
    bullets: [
      "Yêu cầu GPA ≥ 8.0 hoặc có công trình nghiên cứu",
      "TOPIK 4 hoặc IELTS 6.0 trở lên",
      "Kaizen hỗ trợ SOP, thư giới thiệu, phỏng vấn",
    ],
  },
  {
    slug: "d4-nghe",
    visa: "D-2-6",
    name: "Du học nghề Hàn Quốc",
    image: HAN_IMG.seoul,
    duration: "2 năm",
    cost: "Từ 150 triệu/năm",
    desc: "Vừa học cao đẳng nghề vừa làm việc có lương tại doanh nghiệp. Phù hợp gia đình ngân sách hạn chế, muốn có việc làm ngay sau tốt nghiệp.",
    bullets: [
      "Vừa học vừa làm có lương",
      "Chuyển đổi E-7 làm việc dài hạn",
      "Chi phí thấp hơn hệ đại học chính quy",
    ],
  },
];

export const HAN_TIMELINE = [
  {
    step: "01",
    title: "Tư vấn & chọn trường",
    detail: "Đánh giá năng lực, học lực, ngân sách. Kaizen tư vấn 1-1 với chuyên gia 10+ năm thị trường Hàn Quốc, chọn 5 trường visa thẳng phù hợp.",
    months: "Tháng 1",
  },
  {
    step: "02",
    title: "Học tiếng Hàn TOPIK 2 – 4",
    detail: "Khoá tiếng Hàn tại Trung tâm Ngoại ngữ Kaizen (Vinh, Nghệ An). Cam kết đầu ra TOPIK theo yêu cầu từng chương trình.",
    months: "Tháng 2 – 8",
  },
  {
    step: "03",
    title: "Nộp hồ sơ apply trường",
    detail: "Chuẩn bị bảng điểm, thư giới thiệu, SOP, portfolio. Kaizen dịch thuật công chứng và nộp trực tiếp qua kênh trường đối tác — rút ngắn 30% thời gian.",
    months: "Tháng 6 – 9",
  },
  {
    step: "04",
    title: "Nhận thư nhập học & CoE",
    detail: "Trường cấp thư nhập học và mã CoE (Certificate of Eligibility) do Cục Xuất nhập cảnh Hàn Quốc phê duyệt. Đây là điều kiện bắt buộc để xin visa.",
    months: "Tháng 9 – 11",
  },
  {
    step: "05",
    title: "Nộp visa D-2/D-4 tại LSQ",
    detail: "Nộp hồ sơ tại Lãnh sự quán Hàn Quốc (Hà Nội / TP.HCM). Kaizen chuẩn bị đầy đủ giấy tờ, tư vấn phỏng vấn — tỷ lệ đậu 98%.",
    months: "Tháng 11 – 12",
  },
  {
    step: "06",
    title: "Bay sang Hàn & hỗ trợ",
    detail: "Kaizen tổ chức đưa tiễn tại sân bay Nội Bài / Tân Sơn Nhất, đón tại Incheon, hỗ trợ đăng ký cư trú, mở tài khoản ngân hàng, tìm ký túc.",
    months: "Tháng 2 – 3",
  },
];

export const HAN_REQUIREMENTS = [
  {
    group: "Học vấn",
    icon: "📚",
    items: [
      "Tốt nghiệp THPT, GPA ≥ 6.5 (visa D-4)",
      "Tốt nghiệp THPT, GPA ≥ 7.0 (visa D-2 đại học)",
      "Tuổi 18 – 25 với hệ đại học, đến 35 với thạc sĩ",
      "Tốt nghiệp không quá 3 năm khi apply",
    ],
  },
  {
    group: "Ngoại ngữ",
    icon: "🗣️",
    items: [
      "D-4: không bắt buộc TOPIK khi apply",
      "D-2 đại học: TOPIK 3 hoặc IELTS 5.5",
      "GKS / Thạc sĩ: TOPIK 4 hoặc IELTS 6.0",
      "Kaizen đào tạo TOPIK 0 → 3 trong 6 – 8 tháng",
    ],
  },
  {
    group: "Sức khoẻ",
    icon: "💪",
    items: [
      "Khám sức khoẻ tại bệnh viện được LSQ Hàn chỉ định",
      "Xét nghiệm lao (X-quang phổi) bắt buộc",
      "Không mắc bệnh truyền nhiễm (HIV, viêm gan B)",
    ],
  },
  {
    group: "Tài chính",
    icon: "💰",
    items: [
      "Sổ tiết kiệm 10.000 – 20.000 USD (~ 250 – 500 triệu VNĐ)",
      "Xác nhận thu nhập bố mẹ ≥ 20 triệu/tháng",
      "Chi phí năm đầu 200 – 280 triệu (trường visa thẳng)",
      "Phí dịch vụ Kaizen: minh bạch, trả theo lộ trình",
    ],
  },
];

export const HAN_VISA = [
  {
    step: "Mã CoE (Certificate of Eligibility)",
    detail: "Trường Hàn Quốc gửi hồ sơ lên Cục Xuất nhập cảnh xin CoE — bắt buộc để nộp visa. Kaizen theo sát tiến độ với trường đối tác.",
  },
  {
    step: "Sổ tiết kiệm phong toả 10.000 – 20.000 USD",
    detail: "Mở tại ngân hàng thương mại (Vietcombank, BIDV, Shinhan…), phong toả tối thiểu 6 tháng. Có thể rút lại sau khi nhập học.",
  },
  {
    step: "Chứng chỉ TOPIK / IELTS",
    detail: "TOPIK cấp 3 – 4 hoặc IELTS 5.5 – 6.0. Kaizen ôn thi TOPIK trọn gói, mở khoá theo lịch thi hàng tháng.",
  },
  {
    step: "Bảng điểm & bằng THPT dịch công chứng",
    detail: "Dịch thuật hợp pháp hoá lãnh sự tại Sở Tư pháp Hà Nội / TP.HCM. Kaizen xử lý trong 5 – 7 ngày.",
  },
  {
    step: "Khám sức khoẻ & lý lịch tư pháp",
    detail: "Khám tại bệnh viện chỉ định của LSQ Hàn (Việt Pháp, Vinmec, Chợ Rẫy…). Lý lịch tư pháp số 1 do Sở Tư pháp cấp.",
  },
  {
    step: "Nộp visa tại LSQ Hàn Quốc",
    detail: "Đặt lịch tại LSQ Hàn Hà Nội / TP.HCM, phỏng vấn 10 – 15 phút bằng tiếng Việt hoặc tiếng Hàn. Kết quả sau 2 – 4 tuần.",
  },
];

export const HAN_LIFE = [
  {
    topic: "Chi phí sinh hoạt tại Hàn",
    content: "Sinh hoạt phí trung bình 12 – 18 triệu/tháng tuỳ thành phố: Seoul cao nhất, các tỉnh (Gyeongsan, Busan, Daegu) rẻ hơn 20 – 30%. Ăn uống 5 – 8 triệu, nhà 4 – 8 triệu, đi lại 1 – 2 triệu.",
  },
  {
    topic: "Ký túc xá & thuê nhà",
    content: "Ký túc xá trường 3 – 5 triệu/tháng, có sẵn giường, bàn học, wifi. Nhà thuê riêng (One-room / Officetel) 5 – 10 triệu/tháng — deposit ~30 – 50 triệu (được hoàn khi trả nhà).",
  },
  {
    topic: "Việc làm thêm hợp pháp",
    content: "Sau 6 tháng đầu, được làm thêm 20h/tuần trong kỳ, không giới hạn kỳ nghỉ. Việc phổ biến: phục vụ nhà hàng, tiện lợi, gia sư tiếng Việt, dịch thuật, sản xuất — lương 200.000 – 300.000 KRW/ngày.",
  },
  {
    topic: "Định cư & bảo lãnh",
    content: "Sau 3 – 5 năm làm việc + TOPIK 4 → xin visa F-2 (cư trú dài hạn). Sau 5 năm F-2 hoặc đóng thuế đủ 3 năm với mức lương cao → F-5 (định cư vĩnh viễn). Được bảo lãnh vợ/chồng, con cái.",
  },
  {
    topic: "Cộng đồng du học sinh Việt",
    content: "60.000+ du học sinh Việt tại Hàn — đông thứ 2 sau Trung Quốc. Hội Sinh viên Việt Nam tại Hàn Quốc (VSAK) có chi hội tại Seoul, Busan, Daegu, Gwangju — hỗ trợ nhau khi mới sang.",
  },
];

export const HAN_FAQS = [
  {
    q: "Visa D-2 và D-4 Hàn Quốc khác nhau như thế nào?",
    a: "D-4 dành cho học viên học tiếng Hàn tại trung tâm của trường đại học (6 – 24 tháng), không yêu cầu TOPIK khi apply. D-2 dành cho hệ chính quy: cao đẳng (D-2-1), đại học (D-2-2), thạc sĩ (D-2-3), tiến sĩ (D-2-4) — yêu cầu TOPIK 3 trở lên. Tài chính D-2 cũng cao hơn D-4.",
  },
  {
    q: "Chi phí du học Hàn Quốc thực tế bao nhiêu?",
    a: "Năm đầu 200 – 280 triệu VNĐ với trường visa thẳng, 280 – 400 triệu với trường top (SKY, Hanyang…). Chi phí này chưa tính sổ tiết kiệm phong toả 10.000 – 20.000 USD (sẽ được rút sau khi nhập học).",
  },
  {
    q: "Du học sinh có được làm thêm tại Hàn Quốc không?",
    a: "Có. Sau 6 tháng đầu, du học sinh được làm thêm hợp pháp 20 giờ/tuần trong kỳ và không giới hạn vào kỳ nghỉ. Lương tối thiểu 2026 là 9.860 KRW/giờ — thu nhập trung bình 15 – 25 triệu VNĐ/tháng, đủ trang trải sinh hoạt phí.",
  },
  {
    q: "Học bổng du học Hàn Quốc gồm những loại nào?",
    a: "GKS (Chính phủ Hàn Quốc — toàn phần học phí + 900.000 KRW/tháng), BK21 (sau đại học), học bổng trường 30 – 100% học phí, học bổng địa phương Seoul / Busan / Gyeonggi. Kaizen hỗ trợ săn học bổng phù hợp năng lực từng học viên.",
  },
  {
    q: "Sau khi tốt nghiệp có được ở lại Hàn Quốc làm việc?",
    a: "Có. Sau tốt nghiệp được cấp visa D-10 (tìm việc) 6 tháng. Tìm được việc → chuyển E-7 (làm việc chuyên ngành). Sau 3 – 5 năm + TOPIK 4 → xin F-2 (cư trú dài hạn) và F-5 (định cư vĩnh viễn) sau đó.",
  },
  {
    q: "Visa D-4 gia hạn được bao lâu?",
    a: "Gia hạn 6 tháng/lần, tối đa 2 năm. Điều kiện gia hạn: chuyên cần ≥ 70%, đóng học phí đầy đủ. Sau 1 – 2 năm tiếng, đạt TOPIK 3 → chuyển sang D-2 học chính quy.",
  },
  {
    q: "Tôi ở Nghệ An, đăng ký tư vấn du học Hàn Quốc ở đâu?",
    a: "Văn phòng Kaizen tại Vinh, Nghệ An tiếp nhận tư vấn trực tiếp Thứ 2 – Thứ 7. Bạn cũng có thể đăng ký online qua form tư vấn — chuyên viên sẽ liên hệ trong vòng 24h.",
  },
  {
    q: "Thời gian xử lý hồ sơ du học Hàn Quốc mất bao lâu?",
    a: "Tổng thời gian từ đăng ký đến xuất cảnh khoảng 6 – 8 tháng: học tiếng TOPIK (4 – 6 tháng), apply trường (4 – 6 tuần), khám sức khoẻ + dịch thuật (2 tuần), xin visa (2 – 4 tuần), chuẩn bị xuất cảnh (2 tuần).",
  },
];
