import heroImg from "@/assets/duc/duc-hero.jpg.asset.json";
import dieuduongImg from "@/assets/duc/duc-dieuduong.jpg.asset.json";
import daubepImg from "@/assets/duc/duc-daubep.jpg.asset.json";
import lamthemImg from "@/assets/duc/duc-lamthem.jpg.asset.json";
import lopducImg from "@/assets/duc/duc-lopduc.jpg.asset.json";
import nganhImg from "@/assets/duc/duc-nganh.jpg.asset.json";
import visaImg from "@/assets/duc/duc-visa.jpg.asset.json";
import khaigiangImg from "@/assets/duc/duc-khaigiang.jpg.asset.json";

/**
 * Nội dung biên tập lại từ 19 bài viết Du học nghề Đức trên kaizenvn.vn
 * Cập nhật mốc 2026, giọng văn theo skill kaizen-content-vi.
 */
export const DUC_IMG = {
  hero: heroImg.url,
  dieuduong: dieuduongImg.url,
  daubep: daubepImg.url,
  lamthem: lamthemImg.url,
  lopduc: lopducImg.url,
  nganh: nganhImg.url,
  visa: visaImg.url,
  khaigiang: khaigiangImg.url,
};

export const DUC_STATS = [
  { label: "Học phí Đại học công", value: "MIỄN PHÍ 100%" },
  { label: "Lương du học nghề", value: "950 – 1.300 EUR/tháng" },
  { label: "Tỷ lệ đậu visa", value: "95%+" },
  { label: "Thời gian định cư", value: "Sau 5 năm" },
];

export const DUC_WHY = [
  {
    title: "Chất lượng giáo dục hàng đầu thế giới",
    desc: "Đức nằm trong top 5 hệ thống giáo dục toàn cầu, mô hình đào tạo kép vừa học vừa làm — bạn vừa lấy bằng nghề được EU công nhận, vừa thực tập có lương ngay tại doanh nghiệp.",
  },
  {
    title: "Miễn 100% học phí, có lương trong khi học",
    desc: "Hơn 400 trường đại học công lập miễn học phí cả cho sinh viên quốc tế. Du học nghề được trả lương 950 – 1.300 EUR/tháng, đủ trang trải sinh hoạt và gửi về gia đình.",
  },
  {
    title: "Việc làm 99% sau tốt nghiệp",
    desc: "Đức đang thiếu hơn 1,8 triệu lao động có tay nghề ở 19 lĩnh vực, đặc biệt là y tế, điều dưỡng, kỹ thuật. Gần 100% học viên có việc ngay khi còn trên ghế nhà trường.",
  },
  {
    title: "Lộ trình định cư rõ ràng sau 5 năm",
    desc: "Sau khi học nghề và đi làm 5 năm, bạn đủ điều kiện xin thẻ định cư vĩnh viễn (Niederlassungserlaubnis), được bảo lãnh người thân sang Đức.",
  },
  {
    title: "An sinh xã hội tốt nhất châu Âu",
    desc: "Bảo hiểm y tế toàn diện, lương hưu, trợ cấp thất nghiệp, môi trường sống an toàn — Đức được World Happiness Report xếp top 15 quốc gia đáng sống nhất.",
  },
  {
    title: "Cộng đồng người Việt 200.000+ người",
    desc: "Cộng đồng người Việt tại Đức đông đảo, hỗ trợ nhau khi mới sang. Kaizen liên kết với hội du học sinh tại Berlin, München, Frankfurt — đón sân bay, hỗ trợ thuê nhà.",
  },
];

export const DUC_PROGRAMS = [
  {
    slug: "dieu-duong",
    name: "Du học nghề Điều dưỡng",
    image: DUC_IMG.dieuduong,
    duration: "3 năm",
    salary: "1.100 – 1.300 EUR/tháng (khi học)",
    hot: true,
    desc: "Ngành mũi nhọn được chính phủ Đức bảo trợ. Lương sau tốt nghiệp 2.500 – 3.200 EUR/tháng (~65–80 triệu VNĐ). Gần như 100% học viên có việc ngay khi còn đi học.",
    bullets: [
      "Miễn 100% học phí, ký túc xá hỗ trợ",
      "Lương khi học: 1.100 EUR (năm 1) → 1.300 EUR (năm 3)",
      "Tiếng Đức yêu cầu B1 — Kaizen đào tạo trọn gói",
    ],
  },
  {
    slug: "co-khi-ky-thuat",
    name: "Cơ khí – Kỹ thuật ô tô",
    image: DUC_IMG.nganh,
    duration: "3 – 3,5 năm",
    salary: "1.000 – 1.200 EUR/tháng",
    hot: true,
    desc: "Đức là cường quốc cơ khí (BMW, Mercedes, Bosch, Siemens). Cơ hội việc làm tại tập đoàn lớn với mức lương khởi điểm 2.800 EUR/tháng sau tốt nghiệp.",
    bullets: [
      "Hợp tác trực tiếp với doanh nghiệp Đức",
      "Có cơ hội định cư sau 3 năm làm việc",
      "Phù hợp nam, học khá Toán – Lý",
    ],
  },
  {
    slug: "nha-hang-khach-san",
    name: "Đầu bếp – Nhà hàng khách sạn",
    image: DUC_IMG.daubep,
    duration: "3 năm",
    salary: "950 – 1.150 EUR/tháng",
    desc: "Nấu ăn là thế mạnh của người Việt. Học tại các nhà hàng/khách sạn 4–5 sao quốc tế, dễ dàng tự mở nhà hàng riêng sau khi tích lũy vốn và tay nghề.",
    bullets: [
      "Làm việc trong môi trường quốc tế",
      "Có cơ hội tự kinh doanh sau 3–5 năm",
      "Tiếng Đức B1 + năng khiếu nấu nướng",
    ],
  },
  {
    slug: "cntt",
    name: "Công nghệ thông tin",
    image: DUC_IMG.nganh,
    duration: "3 năm",
    salary: "1.100 – 1.400 EUR/tháng",
    desc: "Đức thiếu hơn 137.000 kỹ sư IT. Mức lương sau tốt nghiệp 3.500 – 4.500 EUR/tháng. Phù hợp các bạn yêu công nghệ, giỏi tư duy logic.",
    bullets: [
      "Học tại các thành phố công nghệ: Berlin, Munich",
      "Cơ hội làm việc cho startup & tập đoàn",
      "Định cư nhanh nhờ visa Blue Card",
    ],
  },
  {
    slug: "du-lich-khach-san",
    name: "Du lịch – Lữ hành",
    image: DUC_IMG.daubep,
    duration: "3 năm",
    salary: "950 – 1.100 EUR/tháng",
    desc: "Mỗi học kỳ ngành Tourismus có thời gian thực tập tại nước ngoài. Cơ hội đi khắp châu Âu, làm việc tại các tập đoàn du lịch lớn của Đức.",
    bullets: [
      "Đi thực tập tại nhiều nước EU",
      "Phù hợp các bạn năng động, ngoại ngữ tốt",
      "Có cơ hội định cư diện kỹ năng",
    ],
  },
  {
    slug: "xay-dung-dien",
    name: "Xây dựng – Cơ điện",
    image: DUC_IMG.nganh,
    duration: "3 – 3,5 năm",
    salary: "1.000 – 1.300 EUR/tháng",
    desc: "Ngành đang thiếu hụt nghiêm trọng. Sau tốt nghiệp mức lương 2.700 – 3.500 EUR/tháng, dễ định cư, có cơ hội mở công ty riêng.",
    bullets: [
      "Học việc tại công ty xây dựng Đức",
      "Bằng nghề Meister mở cửa hàng riêng",
      "Phù hợp nam, sức khoẻ tốt",
    ],
  },
  {
    slug: "ban-hang-kinh-doanh",
    name: "Thương mại – Bán hàng",
    image: DUC_IMG.nganh,
    duration: "3 năm",
    salary: "950 – 1.150 EUR/tháng",
    desc: "Đào tạo nghiệp vụ kinh doanh, kế toán, marketing tại các tập đoàn bán lẻ. Phù hợp các bạn yêu thích kinh tế, giao tiếp tốt.",
    bullets: [
      "Cơ hội việc làm rộng mở",
      "Lương sau tốt nghiệp 2.500 EUR/tháng",
      "Phù hợp cả nam và nữ",
    ],
  },
  {
    slug: "dai-hoc-chinh-quy",
    name: "Đại học chính quy",
    image: DUC_IMG.lopduc,
    duration: "3 – 4 năm",
    salary: "Miễn 100% học phí",
    desc: "Bachelor/Master tại 400+ đại học công lập miễn học phí. Bằng cấp được công nhận toàn cầu, học bổng DAAD lên tới toàn phần.",
    bullets: [
      "Miễn học phí cho cả sinh viên quốc tế",
      "Học bổng DAAD, Deutschlandstipendium",
      "Yêu cầu B2 – C1 tiếng Đức + APS",
    ],
  },
];

export const DUC_TIMELINE = [
  {
    step: "01",
    title: "Tư vấn & chọn ngành",
    detail: "Đánh giá năng lực, ngân sách, sở thích — Kaizen tư vấn miễn phí 1-1 với chuyên gia 10+ năm kinh nghiệm thị trường Đức.",
    months: "Tháng 1",
  },
  {
    step: "02",
    title: "Học tiếng Đức A1 → B1",
    detail: "Khoá tiếng Đức 8–12 tháng tại Trung tâm Ngoại ngữ Kaizen (Vinh, Nghệ An). Cam kết đầu ra B1 chuẩn Goethe / telc.",
    months: "Tháng 2 – 11",
  },
  {
    step: "03",
    title: "Phỏng vấn & ký hợp đồng nghề",
    detail: "Doanh nghiệp Đức phỏng vấn trực tiếp tại văn phòng Kaizen hoặc online. Ký hợp đồng đào tạo nghề (Ausbildungsvertrag).",
    months: "Tháng 10 – 12",
  },
  {
    step: "04",
    title: "Hồ sơ tài khoản phong toả & APS",
    detail: "Mở tài khoản phong toả 11.904 EUR/năm, hoàn thiện hồ sơ APS, dịch thuật công chứng, bảo hiểm sức khoẻ.",
    months: "Tháng 12 – 1",
  },
  {
    step: "05",
    title: "Nộp visa tại ĐSQ Đức",
    detail: "Đặt lịch ĐSQ Đức tại Hà Nội/TP.HCM, phỏng vấn, nộp visa du học nghề. Thời gian xử lý 6 – 12 tuần.",
    months: "Tháng 1 – 3",
  },
  {
    step: "06",
    title: "Bay sang Đức & hỗ trợ",
    detail: "Kaizen tổ chức đưa tiễn, đón sân bay tại Frankfurt/Munich, hỗ trợ đăng ký cư trú, ngân hàng, bảo hiểm.",
    months: "Tháng 3 – 9",
  },
];

export const DUC_REQUIREMENTS = [
  {
    group: "Học vấn",
    icon: "📚",
    items: [
      "Tốt nghiệp THPT, GPA ≥ 6.5 (du học nghề)",
      "Tốt nghiệp THPT + đỗ ĐH chính quy (du học đại học)",
      "Tuổi 18 – 30",
      "Không có tiền án tiền sự",
    ],
  },
  {
    group: "Ngoại ngữ",
    icon: "🗣️",
    items: [
      "Du học nghề: tiếng Đức B1 (Goethe/telc/ÖSD)",
      "Đại học: tiếng Đức B2 hoặc C1 + APS",
      "Kaizen đào tạo trọn gói A1 → B1 trong 8–12 tháng",
      "Cam kết đầu ra hoặc hoàn học phí",
    ],
  },
  {
    group: "Sức khoẻ",
    icon: "💪",
    items: [
      "Khám sức khoẻ tại bệnh viện được ĐSQ Đức chỉ định",
      "Không mắc bệnh truyền nhiễm (HIV, lao, viêm gan B)",
      "Sức khoẻ tốt, không khuyết tật ảnh hưởng nghề học",
    ],
  },
  {
    group: "Tài chính",
    icon: "💶",
    items: [
      "Tài khoản phong toả 11.904 EUR/năm (≈ 320 triệu VNĐ)",
      "Bảo hiểm y tế quốc tế ~120 EUR/tháng",
      "Phí dịch vụ Kaizen: trả theo lộ trình, minh bạch",
    ],
  },
];

export const DUC_VISA = [
  {
    step: "Hợp đồng học nghề (Ausbildungsvertrag)",
    detail: "Doanh nghiệp Đức ký hợp đồng đào tạo nghề 3 năm, cam kết lương 950–1.300 EUR/tháng và bảo hiểm.",
  },
  {
    step: "Chứng chỉ tiếng Đức B1",
    detail: "Bằng B1 từ Viện Goethe, telc hoặc ÖSD — Kaizen đào tạo & ôn thi trọn gói.",
  },
  {
    step: "Tài khoản phong toả (Sperrkonto)",
    detail: "Mở tại Fintiba, Expatrio hoặc Deutsche Bank với số dư 11.904 EUR/năm.",
  },
  {
    step: "Đặt lịch & phỏng vấn ĐSQ Đức",
    detail: "Đăng ký tại hanoi.diplo.de hoặc hochiminhstadt.diplo.de. Phỏng vấn bằng tiếng Đức ~15 phút.",
  },
  {
    step: "Bảo hiểm y tế quốc tế",
    detail: "Bảo hiểm Care Concept, Mawista hoặc DR-WALTER — bắt buộc khi nộp visa.",
  },
  {
    step: "Hồ sơ học vấn & cá nhân",
    detail: "Hộ chiếu, bằng THPT, học bạ, sơ yếu lý lịch, thư động lực (Motivationsschreiben) bằng tiếng Đức.",
  },
];

export const DUC_LIFE = [
  {
    topic: "Lương & sinh hoạt",
    content: "Lương du học nghề 950–1.300 EUR/tháng. Sinh hoạt phí tại các thành phố vừa khoảng 800–1.000 EUR/tháng. Bạn vẫn dư 200–400 EUR mỗi tháng để gửi về gia đình hoặc tiết kiệm.",
  },
  {
    topic: "Làm thêm hợp pháp",
    content: "Sinh viên đại học được làm thêm 120 ngày toàn thời gian/năm hoặc 240 nửa ngày. Mức lương phổ biến 12–15 EUR/giờ (chạy bàn, giao đồ ăn, gia sư, kho hàng).",
  },
  {
    topic: "Bảo hiểm y tế toàn diện",
    content: "Bảo hiểm công TK, AOK chi trả 100% khám chữa bệnh, nha khoa, mắt. Phí bảo hiểm sinh viên ~120 EUR/tháng đã bao gồm trong các chương trình du học nghề.",
  },
  {
    topic: "Định cư & bảo lãnh người thân",
    content: "Sau 21 tháng đi làm với tiếng B1 hoặc 33 tháng với tiếng A1, bạn được xin định cư vĩnh viễn. Sau khi định cư, được bảo lãnh vợ/chồng, con cái sang Đức.",
  },
  {
    topic: "Cộng đồng người Việt",
    content: "200.000+ người Việt sinh sống tại Đức, tập trung tại Berlin, Hamburg, München, Frankfurt. Có hội đồng hương Nghệ An, chùa Việt, chợ Việt, hỗ trợ nhau khi mới sang.",
  },
];

export const DUC_FAQS = [
  {
    q: "Du học nghề Đức có thực sự miễn 100% học phí không?",
    a: "Đúng. Toàn bộ học phí do doanh nghiệp Đức và chính phủ chi trả. Bạn còn được nhận lương 950–1.300 EUR/tháng trong suốt 3 năm học nghề. Đây là điểm khác biệt lớn so với du học các nước khác.",
  },
  {
    q: "Cần bao nhiêu tiền để chuẩn bị đi du học nghề Đức?",
    a: "Chi phí chuẩn bị khoảng 320–380 triệu VNĐ, gồm: tài khoản phong toả 11.904 EUR/năm (~320 triệu), vé máy bay 25 triệu, bảo hiểm + dịch thuật + visa ~15 triệu, phí dịch vụ Kaizen. Tiền phong toả được hoàn lại từng tháng cho bạn dùng.",
  },
  {
    q: "Tiếng Đức học bao lâu thì thi được B1?",
    a: "Trung bình 8–12 tháng học liên tục 4 buổi/tuần tại Trung tâm Ngoại ngữ Kaizen. Lộ trình A1 (2 tháng) → A2 (3 tháng) → B1 (4–6 tháng). Kaizen cam kết đầu ra hoặc hoàn học phí.",
  },
  {
    q: "Tuổi 25–30 có đi được không?",
    a: "Hoàn toàn được. Kaizen có nhiều học viên 28–30 tuổi đi du học nghề điều dưỡng, cơ khí thành công. Một số ngành như điều dưỡng còn ưu tiên người đã có kinh nghiệm làm việc.",
  },
  {
    q: "Học nghề xong có chuyển sang đại học được không?",
    a: "Được. Sau khi hoàn thành nghề và làm việc 2–3 năm, bạn có thể đăng ký học tiếp đại học hoặc chương trình Meister (kỹ sư trưởng) để nâng cao bằng cấp và mức lương.",
  },
  {
    q: "Nếu rớt visa thì sao? Kaizen có cam kết gì?",
    a: "Kaizen cam kết hỗ trợ đến khi đậu visa. Trường hợp rớt vì lý do hồ sơ, Kaizen làm lại miễn phí. Tỷ lệ đậu visa của học viên Kaizen 95%+ nhờ chuẩn bị hồ sơ chuyên sâu.",
  },
  {
    q: "Bao lâu thì được định cư vĩnh viễn?",
    a: "Sau 5 năm sống và làm việc hợp pháp tại Đức (gồm 3 năm học nghề + 2 năm đi làm), bạn đủ điều kiện xin thẻ định cư vĩnh viễn Niederlassungserlaubnis. Đối với người tốt nghiệp đại học có thể chỉ cần 21 tháng.",
  },
  {
    q: "Có thể bảo lãnh gia đình sang Đức không?",
    a: "Có. Sau khi nhận visa làm việc dài hạn hoặc định cư, bạn được bảo lãnh vợ/chồng và con dưới 18 tuổi sang Đức. Người thân sang được học miễn phí, làm việc không giới hạn.",
  },
  {
    q: "Cộng đồng người Việt tại Đức như thế nào?",
    a: "Hơn 200.000 người Việt đang sinh sống, tập trung ở Berlin, Hamburg, München, Frankfurt. Có hội đồng hương các tỉnh, chùa, chợ Việt, dễ dàng tìm thực phẩm quê hương và hỗ trợ khi cần.",
  },
  {
    q: "Kaizen hỗ trợ những gì khi sang Đức?",
    a: "Đón sân bay, hỗ trợ đăng ký cư trú (Anmeldung), mở tài khoản ngân hàng, mua sim, định hướng nơi ở, giới thiệu cộng đồng người Việt. Kaizen có văn phòng đại diện tại Berlin để hỗ trợ học viên dài hạn.",
  },
  {
    q: "Ngành nào dễ định cư nhất tại Đức?",
    a: "Theo Cơ quan Quản lý Lao động Liên bang Đức, các ngành dễ định cư gồm: Điều dưỡng, Bác sĩ, Kỹ sư cơ khí, IT, Xây dựng, Đầu bếp. Đây cũng là 6 nhóm ngành đang thiếu lao động trầm trọng nhất.",
  },
  {
    q: "Có cần chứng minh tài chính ngoài tài khoản phong toả?",
    a: "Với du học nghề có hợp đồng lương thì KHÔNG cần chứng minh thêm. Với du học đại học, ngoài tài khoản phong toả 11.904 EUR/năm cần thêm sao kê sổ tiết kiệm gia đình tương đương 3 năm chi phí.",
  },
];
