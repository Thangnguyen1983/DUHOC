// Nội dung chọn lọc từ kaizenvn.vn (bản cũ) — các sự kiện & cột mốc nổi bật 2024–2026
// Mục đích: lưu trữ giá trị thương hiệu để hiển thị trên trang chủ và trang Về Kaizen.

export type Highlight = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  dateLabel: string; // hiển thị (vd: "Tháng 1/2026")
  category: "MOU" | "Sự kiện" | "Đối tác" | "Trách nhiệm xã hội" | "Vinh danh";
  title: string;
  excerpt: string;
  location?: string;
};

export const CURATED_HIGHLIGHTS: Highlight[] = [
  {
    id: "mou-da-van-hoa-han-quoc-2026",
    date: "2026-01-20",
    dateLabel: "Tháng 1/2026",
    category: "MOU",
    title: "Ký kết MOU với Hiệp hội Đa Văn hoá Hàn Quốc",
    excerpt:
      "Bước tiến quan trọng trong chiến lược mở rộng hợp tác quốc tế, phát triển nguồn nhân lực chất lượng cao tại thị trường Hàn Quốc.",
    location: "Nghệ An, Việt Nam",
  },
  {
    id: "don-tiep-doi-tac-macau-2026",
    date: "2026-01-12",
    dateLabel: "12/01/2026",
    category: "Đối tác",
    title: "Đón tiếp đoàn đối tác Macau làm việc tại văn phòng Kaizen",
    excerpt:
      "Mở rộng kênh phái cử nhân lực sang thị trường Macau, đa dạng hoá lựa chọn cho người lao động Việt Nam.",
    location: "Văn phòng Kaizen, Nghệ An",
  },
  {
    id: "dien-dan-lao-dong-leipzig-duc-2025",
    date: "2025-12-09",
    dateLabel: "09/12/2025",
    category: "Sự kiện",
    title: "Tham dự Diễn đàn Lao động Đức – Việt Nam tại Leipzig (CHLB Đức)",
    excerpt:
      "Kaizen đại diện doanh nghiệp Việt Nam tham gia diễn đàn do Bộ Nội vụ Việt Nam, Bộ Lao động Liên bang Đức và chính quyền Leipzig phối hợp tổ chức.",
    location: "Leipzig, CHLB Đức",
  },
  {
    id: "mou-suseong-university-2025",
    date: "2025-10-22",
    dateLabel: "22/10/2025",
    category: "MOU",
    title: "MOU với Đại học Suseong (Hàn Quốc)",
    excerpt:
      "Mở rộng cơ hội học tập và chuyển tiếp đại học cho học viên Kaizen tại Hàn Quốc theo chương trình hợp tác trực tiếp.",
    location: "Trụ sở Kaizen, phường Thành Vinh, Nghệ An",
  },
  {
    id: "ngay-doanh-nhan-vn-2025",
    date: "2025-10-13",
    dateLabel: "13/10/2025",
    category: "Vinh danh",
    title: "Kỷ niệm 21 năm Ngày Doanh nhân Việt Nam",
    excerpt:
      "Tổng giám đốc Kaizen gửi lời tri ân tới cộng đồng doanh nghiệp, khách hàng và đối tác trong lĩnh vực nhân lực và tư vấn du học.",
  },
  {
    id: "khac-phuc-bao-wipha-2025",
    date: "2025-07-25",
    dateLabel: "Tháng 7/2025",
    category: "Trách nhiệm xã hội",
    title: "Chung tay khắc phục hậu quả bão Wipha tại Con Cuông",
    excerpt:
      "Kaizen đồng hành cùng nhân dân Con Cuông (Nghệ An) sớm trở lại cuộc sống bình thường sau bão.",
    location: "Con Cuông, Nghệ An",
  },
  {
    id: "ton-vinh-nu-lanh-dao-2023",
    date: "2023-10-09",
    dateLabel: "09/10/2023",
    category: "Vinh danh",
    title: "Tôn vinh 36 Nữ Lãnh đạo Doanh nghiệp tiêu biểu",
    excerpt:
      "Đại diện Kaizen có mặt tại Hội nghị Biểu dương Nữ Lãnh đạo Doanh nghiệp Tiêu biểu năm 2023.",
  },
  {
    id: "diem-moi-xkld-2024",
    date: "2024-01-15",
    dateLabel: "Năm 2024",
    category: "Sự kiện",
    title: "Cập nhật chính sách mới cho người lao động đi nước ngoài 2024",
    excerpt:
      "Kaizen tổng hợp & tư vấn các điểm mới về quyền lợi, thủ tục và bảo hộ pháp lý dành cho lao động Việt Nam ra nước ngoài làm việc.",
  },
];

// 5 USP cốt lõi tinh chỉnh từ trang chủ cũ — dùng cho TrustBand / About
export const CORE_USPS = [
  {
    title: "Được Bộ LĐ-TB&XH cấp phép",
    description:
      "Trực tiếp đưa người lao động đi làm việc có thời hạn ở nước ngoài — không qua trung gian.",
  },
  {
    title: "Không qua môi giới",
    description:
      "Người lao động & học viên đăng ký trực tiếp với cán bộ công ty, giảm thiểu rủi ro và chi phí ẩn.",
  },
  {
    title: "Cam kết hoàn phí",
    description:
      "Hoàn 100% chi phí xuất cảnh nếu không hài lòng về đơn hàng; hoàn phí du học nếu trượt visa.",
  },
  {
    title: "Phỏng vấn trực tiếp tại Nghệ An",
    description:
      "Gặp trực tiếp chủ sử dụng, nghiệp đoàn, đại diện trường — hoặc phỏng vấn online qua Skype/Zoom.",
  },
  {
    title: "Đồng hành trọn hành trình",
    description:
      "Theo sát quá trình học tập, làm việc của học viên & lao động — báo cáo định kỳ về gia đình.",
  },
] as const;
