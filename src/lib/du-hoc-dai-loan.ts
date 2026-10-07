import heroImg from "@/assets/dai-loan/dai-loan-hero.jpg";
import sinhvienImg from "@/assets/dai-loan/dai-loan-sinhvien.jpg";
import kythuatImg from "@/assets/dai-loan/dai-loan-kythuat.jpg";
import quantriImg from "@/assets/dai-loan/dai-loan-quantri.jpg";
import truongImg from "@/assets/dai-loan/dai-loan-truong.jpg";
import visaImg from "@/assets/dai-loan/dai-loan-visa.jpg";
import vanhoaImg from "@/assets/dai-loan/dai-loan-vanhoa.jpg";
import tienghoaImg from "@/assets/dai-loan/dai-loan-tienghoa.jpg";

/**
 * Nội dung biên tập chọn lọc từ các bài viết Du học Đài Loan trên kaizenvn.vn
 * (chitiet=99, 100, 101, 102, 103, 1071, 1140, 1153, 1166, 1172)
 * Cập nhật mốc 2026, giọng văn Kaizen.
 */
export const TW_IMG = {
  hero: heroImg,
  sinhvien: sinhvienImg,
  kythuat: kythuatImg,
  quantri: quantriImg,
  truong: truongImg,
  visa: visaImg,
  vanhoa: vanhoaImg,
  tienghoa: tienghoaImg,
};

export const TW_STATS = [
  { label: "Học phí/năm (CĐ-ĐH)", value: "1.500 – 3.500 USD" },
  { label: "Lương làm thêm", value: "176 NTĐ/giờ (~140k VNĐ)" },
  { label: "Học bổng Chính phủ", value: "Lên tới 100% học phí" },
  { label: "Tỷ lệ đậu visa", value: "98%+" },
];

export const TW_WHY = [
  {
    title: "Giáo dục top châu Á, bằng cấp quốc tế",
    desc: "Đài Loan có 5 trường lọt Top 100 châu Á (NTU, NCKU, NTHU, NYCU, NSYSU). Bằng đại học – thạc sĩ được công nhận tại Mỹ, EU, Nhật Bản và toàn bộ ASEAN.",
  },
  {
    title: "Học bổng dày, miễn 50–100% học phí",
    desc: "Chính phủ Đài Loan (MOE Taiwan Scholarship), Bộ Ngoại giao (ICDF) và bản thân các trường đều cấp học bổng cho sinh viên Việt — từ miễn học phí đến trợ cấp 25.000–30.000 NTĐ/tháng.",
  },
  {
    title: "Vừa học vừa làm – kiếm 20–30 triệu/tháng",
    desc: "Sinh viên được làm thêm hợp pháp 20 giờ/tuần (40 giờ kỳ nghỉ), lương tối thiểu 2026 là 190 NTĐ/giờ. Một tháng có thể kiếm 22.000–28.000 NTĐ, đủ trang trải sinh hoạt.",
  },
  {
    title: "Chi phí sinh hoạt rẻ, an toàn bậc nhất",
    desc: "Tổng chi phí ăn ở chỉ 6.000–9.000 NTĐ/tháng (~5–7 triệu VNĐ). Đài Loan xếp Top 3 châu Á về an toàn theo Numbeo 2025 — phù hợp với cả nữ sinh đi một mình.",
  },
  {
    title: "Văn hoá gần gũi, dễ thích nghi",
    desc: "Ẩm thực, khí hậu, văn hoá á Đông tương đồng Việt Nam. Cộng đồng du học sinh và lao động Việt tại Đài Loan hơn 250.000 người — luôn sẵn sàng hỗ trợ tân du học sinh.",
  },
  {
    title: "Cơ hội việc làm sau tốt nghiệp rộng mở",
    desc: "Đài Loan là trung tâm bán dẫn, điện tử, công nghiệp số 1 châu Á (TSMC, Foxconn, ASUS). Sinh viên giỏi được giữ lại làm việc lương 50.000–80.000 NTĐ/tháng (~40–65 triệu VNĐ).",
  },
];

export const TW_PROGRAMS = [
  {
    slug: "vua-hoc-vua-lam",
    name: "Đại học hệ Vừa học – Vừa làm",
    image: TW_IMG.sinhvien,
    duration: "4 năm",
    salary: "22.000 – 30.000 NTĐ/tháng",
    hot: true,
    desc: 'Mô hình "2+2" hoặc "3+1" đặc trưng Đài Loan: 2 ngày học, 3 ngày thực tập tại doanh nghiệp đối tác. Lương thực tập trả trực tiếp giúp sinh viên trang trải toàn bộ học phí và sinh hoạt.',
    bullets: [
      "Doanh nghiệp ký hợp đồng đảm bảo việc làm",
      "Lương thực tập đủ chi trả học phí + sinh hoạt",
      "Yêu cầu tiếng Hoa TOCFL A2 (Kaizen đào tạo)",
    ],
  },
  {
    slug: "ban-dan-dien-tu",
    name: "Công nghệ bán dẫn – Điện tử",
    image: TW_IMG.kythuat,
    duration: "4 năm",
    salary: "Học bổng 50–100%",
    hot: true,
    desc: "Đài Loan sản xuất 65% chip bán dẫn toàn cầu. Học ngành này đồng nghĩa với cơ hội thực tập tại TSMC, MediaTek, ASE. Lương khởi điểm sau tốt nghiệp: 50.000–70.000 NTĐ/tháng.",
    bullets: [
      "Học bổng MOE Taiwan dành riêng cho STEM",
      "Cơ hội ký hợp đồng làm việc 3–5 năm",
      "Phù hợp nam, giỏi Toán – Lý",
    ],
  },
  {
    slug: "cntt",
    name: "Công nghệ thông tin – AI",
    image: TW_IMG.kythuat,
    duration: "4 năm",
    salary: "Học bổng tới 100%",
    desc: "NTU, NCKU và NYCU thuộc Top 50 châu Á về Computer Science. Chương trình tiếng Anh sẵn có, mức lương kỹ sư AI tại Đài Loan 60.000–90.000 NTĐ/tháng (~48–72 triệu VNĐ).",
    bullets: [
      "Chương trình tiếng Anh (không cần tiếng Hoa)",
      "Học bổng ICDF toàn phần (8 năm trở lại)",
      "Cơ hội định cư diện kỹ năng cao",
    ],
  },
  {
    slug: "quan-tri-kinh-doanh",
    name: "Quản trị Kinh doanh",
    image: TW_IMG.quantri,
    duration: "4 năm",
    salary: "Học phí từ 60.000 NTĐ/kỳ",
    desc: 'Đài Loan là cửa ngõ thương mại giữa Trung Quốc đại lục và ASEAN. Bằng MBA Đài Loan được "Big 4" và các tập đoàn đa quốc gia ưu tiên tuyển dụng tại thị trường châu Á.',
    bullets: [
      "Mạng lưới cựu sinh viên rộng khắp ASEAN",
      "Học song ngữ Hoa – Anh",
      "Cơ hội làm việc tại VN với mức lương cao",
    ],
  },
  {
    slug: "du-lich-khach-san",
    name: "Du lịch – Khách sạn",
    image: TW_IMG.vanhoa,
    duration: "4 năm",
    salary: "Thực tập lương đầy đủ",
    desc: "Đài Loan là điểm đến du lịch hàng đầu châu Á. Sinh viên ngành Tourism được thực tập tại khách sạn 4–5 sao (Grand Hyatt, Shangri-La) với mức lương 25.000 NTĐ/tháng.",
    bullets: [
      "Thực tập tại khách sạn quốc tế",
      "Cơ hội đi tour các nước Đông Á",
      "Phù hợp nữ, ngoại hình ưa nhìn",
    ],
  },
  {
    slug: "ngon-ngu-hoa",
    name: "Ngôn ngữ Hoa & Văn hoá",
    image: TW_IMG.tienghoa,
    duration: "2 – 4 năm",
    salary: "Học bổng Huayu 25.000 NTĐ/tháng",
    desc: "Học tiếng Hoa phồn thể chuẩn tại nguồn. Học bổng Huayu Enrichment của Bộ Giáo dục Đài Loan trả 25.000 NTĐ/tháng (~20 triệu VNĐ) suốt thời gian học từ 3–12 tháng.",
    bullets: [
      "Cơ hội học bổng Huayu cao",
      "Linh hoạt chuyển tiếp đại học",
      "Bằng TOCFL được công nhận quốc tế",
    ],
  },
  {
    slug: "co-khi-tu-dong-hoa",
    name: "Cơ khí – Tự động hoá",
    image: TW_IMG.kythuat,
    duration: "4 năm",
    salary: "22.000 – 28.000 NTĐ/tháng",
    desc: "Ngành thiếu nhân lực trầm trọng tại Đài Loan, các tập đoàn Foxconn, Pegatron, Quanta sẵn sàng ký hợp đồng từ năm 3. Mức lương sau tốt nghiệp 45.000–60.000 NTĐ/tháng.",
    bullets: [
      "Hệ vừa học vừa làm khả thi",
      "Doanh nghiệp tài trợ ký túc xá",
      "Cơ hội ở lại làm việc 100%",
    ],
  },
  {
    slug: "thiet-ke-truyen-thong",
    name: "Thiết kế – Truyền thông",
    image: TW_IMG.quantri,
    duration: "4 năm",
    salary: "Học bổng 30–50%",
    desc: "Đài Loan đứng top châu Á về thiết kế công nghiệp (giải iF, Red Dot). Đại học Sư phạm Quốc gia (NTNU), Thực Tiễn (USC) đào tạo ngành nổi tiếng, phù hợp các bạn sáng tạo.",
    bullets: [
      "Học bổng dành cho ngành nghệ thuật",
      "Workshop quốc tế thường niên",
      "Phù hợp các bạn có portfolio",
    ],
  },
];

export const TW_TIMELINE = [
  {
    step: "01",
    title: "Tư vấn & chọn trường",
    detail: "Kaizen tư vấn 1-1 miễn phí dựa trên học lực, ngân sách, ngành học mong muốn — gợi ý 3-5 trường phù hợp trong danh mục 50+ trường đối tác tại Đài Loan.",
    months: "Tháng 1",
  },
  {
    step: "02",
    title: "Học tiếng Hoa / chuẩn bị tiếng Anh",
    detail: "Khoá tiếng Hoa 6–9 tháng tại Trung tâm Ngoại ngữ Kaizen, đạt TOCFL A2/B1 hoặc TOEIC 550 tuỳ chương trình. Cam kết đầu ra.",
    months: "Tháng 2 – 8",
  },
  {
    step: "03",
    title: "Hồ sơ apply & xin Offer Letter",
    detail: "Hoàn thiện học bạ dịch thuật, bài luận động lực (Study Plan), bảng điểm. Kaizen apply 2–3 trường song song để tăng tỷ lệ đậu học bổng.",
    months: "Tháng 7 – 9",
  },
  {
    step: "04",
    title: "Nhận thư mời & học bổng",
    detail: "Trường Đài Loan trả lời trong 4–8 tuần. Học sinh xuất sắc nhận học bổng MOE/ICDF/trường, mức từ 50% đến toàn phần học phí + 25.000 NTĐ/tháng.",
    months: "Tháng 10 – 11",
  },
  {
    step: "05",
    title: "Nộp visa du học (Resident Visa)",
    detail: "Nộp tại Văn phòng Kinh tế Văn hoá Đài Bắc tại Hà Nội/TP.HCM. Hồ sơ chuẩn 6 đầu mục, thời gian xử lý 10–15 ngày làm việc.",
    months: "Tháng 12 – 1",
  },
  {
    step: "06",
    title: "Bay sang Đài Loan & hỗ trợ định cư",
    detail: "Kaizen tổ chức đoàn bay tập trung, đón sân bay Đào Viên/Cao Hùng, đưa về ký túc xá, làm thẻ cư trú ARC, mở tài khoản ngân hàng & sim 4G.",
    months: "Tháng 2 hoặc Tháng 9",
  },
];

export const TW_REQUIREMENTS = [
  {
    group: "Học vấn",
    icon: "📚",
    items: [
      "Tốt nghiệp THPT, GPA ≥ 6.0 (đại học)",
      "Tốt nghiệp đại học, GPA ≥ 6.5 (thạc sĩ)",
      "Tuổi 18 – 30 (đại học), 22 – 35 (thạc sĩ)",
      "Không có tiền án tiền sự",
    ],
  },
  {
    group: "Ngoại ngữ",
    icon: "🗣️",
    items: [
      "Tiếng Hoa: TOCFL cấp 3 (đại học), cấp 4 (thạc sĩ)",
      "Hoặc tiếng Anh: TOEIC 550 / IELTS 5.5 với chương trình EMI",
      "Kaizen đào tạo tiếng Hoa từ 0 → TOCFL A2/B1",
      "Cam kết đầu ra hoặc hoàn học phí",
    ],
  },
  {
    group: "Sức khoẻ",
    icon: "💪",
    items: [
      "Khám sức khoẻ tại bệnh viện được TECO chỉ định",
      "Không mắc HIV, lao phổi, viêm gan B",
      "Đủ sức khoẻ học tập và làm thêm",
    ],
  },
  {
    group: "Tài chính",
    icon: "💵",
    items: [
      "Sao kê 5.000 – 10.000 USD (tuỳ trường)",
      "Học phí năm đầu: 1.500 – 3.500 USD",
      "Sinh hoạt: 6.000 – 9.000 NTĐ/tháng (đã trừ làm thêm)",
      "Phí dịch vụ Kaizen: minh bạch theo lộ trình",
    ],
  },
];

export const TW_VISA = [
  {
    step: "Thư mời nhập học (Offer Letter)",
    detail: "Bản gốc + công chứng từ trường đại học Đài Loan, có mã số sinh viên và mức học bổng (nếu có).",
  },
  {
    step: "Chứng chỉ ngoại ngữ",
    detail: "TOCFL cấp 3 trở lên (chương trình tiếng Hoa) hoặc TOEIC 550 / IELTS 5.5 (chương trình tiếng Anh).",
  },
  {
    step: "Sao kê tài chính",
    detail: "Sổ tiết kiệm hoặc xác nhận số dư tối thiểu 5.000 USD đứng tên bố mẹ hoặc sinh viên.",
  },
  {
    step: "Hồ sơ học vấn cá nhân",
    detail: "Bằng THPT (dịch thuật công chứng), học bạ, lý lịch tư pháp số 2, hộ chiếu còn hạn ≥ 18 tháng.",
  },
  {
    step: "Khám sức khoẻ",
    detail: "Khám tại bệnh viện do Văn phòng TECO Hà Nội/TP.HCM chỉ định (BV Việt Pháp, BV Chợ Rẫy, BV E…).",
  },
  {
    step: "Nộp visa tại TECO",
    detail: "Đặt lịch online, nộp hồ sơ Resident Visa, phí 66 USD. Xử lý trong 10–15 ngày làm việc, tỷ lệ đậu 98%+.",
  },
];

export const TW_LIFE = [
  {
    topic: "Chi phí sinh hoạt rẻ – chất lượng cao",
    content: "Ký túc xá trường chỉ 2.500–5.000 NTĐ/tháng (~2–4 triệu VNĐ). Một bữa cơm 70–100 NTĐ (~55–80k). Thẻ MRT, xe bus tích hợp EasyCard tiện lợi cho cả Đài Bắc, Cao Hùng, Đài Trung.",
  },
  {
    topic: "Làm thêm hợp pháp – thu nhập ổn",
    content: "Sinh viên được làm 20 giờ/tuần trong học kỳ, 40 giờ vào kỳ nghỉ. Lương tối thiểu 2026 là 190 NTĐ/giờ. Công việc phổ biến: gia sư tiếng Việt, chạy bàn, kho hàng, dịch thuật.",
  },
  {
    topic: "Bảo hiểm y tế toàn dân",
    content: "Sau 6 tháng cư trú, sinh viên bắt buộc tham gia NHI (~826 NTĐ/tháng). Khám bệnh chỉ 150–300 NTĐ/lượt, thuốc miễn phí, được bảo hiểm chi trả tới 70–90% chi phí điều trị.",
  },
  {
    topic: "Cơ hội việc làm sau tốt nghiệp",
    content: "Đài Loan cấp visa Gold Card cho cử nhân giỏi (lương ≥ 47.971 NTĐ/tháng), thời hạn 1–3 năm có thể gia hạn. Sau 5 năm liên tục có thể xin thẻ cư trú vĩnh viễn (APRC).",
  },
  {
    topic: "Cộng đồng người Việt 250.000+ người",
    content: "Lớn nhất khu vực, tập trung tại Đài Bắc, Đào Viên, Đài Trung. Có hội du học sinh tại từng trường, chùa Việt, chợ Việt, dịch vụ chuyển tiền về quê siêu tiện lợi.",
  },
];

export const TW_FAQS = [
  {
    q: "Du học Đài Loan tốn bao nhiêu tiền cho năm đầu tiên?",
    a: "Tổng chi phí năm đầu khoảng 200–280 triệu VNĐ, gồm: học phí 1.500–3.500 USD (~40–90 triệu), sinh hoạt 6.000–9.000 NTĐ/tháng × 12 (~60–80 triệu), vé máy bay + bảo hiểm + thủ tục (~25 triệu), phí dịch vụ Kaizen. Sau khi có việc làm thêm 22.000 NTĐ/tháng, bạn gần như tự trang trải được toàn bộ.",
  },
  {
    q: "Không biết tiếng Hoa có du học Đài Loan được không?",
    a: "Hoàn toàn được. Bạn có thể chọn chương trình EMI (giảng dạy bằng tiếng Anh) yêu cầu TOEIC 550 / IELTS 5.5; hoặc học khoá tiếng Hoa 6–12 tháng tại Đài Loan (kèm học bổng Huayu 25.000 NTĐ/tháng) trước khi vào chuyên ngành. Kaizen có lớp tiếng Hoa từ 0 tại Vinh – Nghệ An.",
  },
  {
    q: "Học bổng MOE Taiwan có khó xin không?",
    a: "Học bổng Bộ Giáo dục Đài Loan (MOE) trị giá đến 40.000 NTĐ/tháng + miễn học phí, dành cho ~1.000 suất/năm trên toàn cầu, Việt Nam thường được 30–40 suất. Tỷ lệ cạnh tranh ~5:1 với hồ sơ GPA ≥ 7.0 + IELTS 6.0 hoặc TOCFL B1 trở lên.",
  },
  {
    q: "Sinh viên Đài Loan được làm thêm bao nhiêu giờ?",
    a: "20 giờ/tuần trong học kỳ và 40 giờ/tuần kỳ nghỉ. Lương tối thiểu 2026 là 190 NTĐ/giờ. Thu nhập 18–28 triệu VNĐ/tháng — đủ trang trải sinh hoạt và tiết kiệm. Lưu ý: phải xin giấy phép làm thêm tại Cục Lao động (miễn phí, 7–10 ngày).",
  },
  {
    q: "Học xong có ở lại Đài Loan làm việc được không?",
    a: "Được. Bạn được cấp visa tìm việc 6 tháng sau tốt nghiệp. Nếu được tuyển với lương ≥ 47.971 NTĐ/tháng, doanh nghiệp xin Work Permit cho bạn. Sau 5 năm liên tục có thể xin thẻ định cư vĩnh viễn (APRC) và sau đó là quốc tịch.",
  },
  {
    q: "Đại học Đài Loan nào uy tín nhất?",
    a: "Top 10 trường được Kaizen tư vấn: NTU (ĐH Quốc lập Đài Loan), NCKU (Thành Công), NTHU (Thanh Hoa), NYCU (Dương Minh Giao Thông), NSYSU (Tôn Trung Sơn), NCU (Trung Ương), NTUST (KH-KT Đài Bắc), Minh Tân (MUST), Triều Dương, Nam Khai. Tất cả đều thuộc Top 500 thế giới hoặc Top 100 châu Á.",
  },
  {
    q: "Học hệ Vừa học – Vừa làm có thật sự miễn học phí không?",
    a: "Đúng. Mô hình '2+2' hoặc '3+1' của Đài Loan: doanh nghiệp đối tác chi trả 100% học phí, sinh viên thực tập 3 ngày/tuần với lương 22.000–30.000 NTĐ/tháng. Cam kết bằng hợp đồng đào tạo. Đây là điểm đặc biệt mà ít quốc gia châu Á có được.",
  },
  {
    q: "Visa du học Đài Loan thường rớt vì lý do gì?",
    a: "3 lý do phổ biến: (1) Hồ sơ tài chính không thuyết phục (sổ tiết kiệm mở < 3 tháng), (2) Bài luận Study Plan sơ sài, (3) Trình độ tiếng Hoa/Anh không đạt yêu cầu trường. Kaizen có quy trình rà soát 3 vòng, tỷ lệ đậu 98%+.",
  },
  {
    q: "Có thể chuyển từ du học sang định cư không?",
    a: "Có. Lộ trình chuẩn: Du học 4 năm → Visa tìm việc 6 tháng → Work Permit + ARC (gia hạn hàng năm) → Sau 5 năm liên tục xin APRC (định cư vĩnh viễn) → Sau 5 năm APRC xin nhập tịch Đài Loan (giữ quốc tịch VN nếu Đài Loan đồng ý).",
  },
  {
    q: "Cuộc sống tại Đài Loan có an toàn không?",
    a: "Đài Loan xếp Top 3 châu Á về an toàn theo Numbeo 2025. Tội phạm bạo lực gần như không có, cảnh sát thân thiện. Nữ sinh có thể đi tàu MRT/xe buýt buổi đêm an toàn. Người dân Đài Loan nổi tiếng lịch sự, thân thiện với người Việt.",
  },
  {
    q: "Kaizen hỗ trợ những gì trong và sau khi sang Đài Loan?",
    a: "Đón sân bay Đào Viên/Cao Hùng, đưa về ký túc xá, làm thẻ ARC, mở tài khoản, mua sim 4G, hướng dẫn giấy phép làm thêm. Kaizen có văn phòng đại diện và nhóm Zalo hỗ trợ 24/7 du học sinh trong suốt thời gian học.",
  },
  {
    q: "Học phí trường tư vs trường công khác nhau thế nào?",
    a: "Trường công (NTU, NCKU…) học phí 50.000–70.000 NTĐ/kỳ (~40–55 triệu VNĐ/năm). Trường tư (Minh Tân, Triều Dương, Nam Khai…) học phí 60.000–95.000 NTĐ/kỳ. Trường tư thường có hệ Vừa học – Vừa làm và học bổng 50–100% hấp dẫn cho sinh viên Việt.",
  },
];
