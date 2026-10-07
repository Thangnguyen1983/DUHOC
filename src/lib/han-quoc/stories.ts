export type Story = {
  slug: string;
  studentName: string; // shortened for PII
  hometown: string; // tỉnh
  age: number;
  year: number; // năm xuất cảnh
  university: string;
  major: string;
  visaType: "D-2" | "D-4";
  quote: string;
  image: string; // placeholder
  highlight: string;
};

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

export const HAN_QUOC_STORIES: Story[] = [
  {
    slug: "nguyen-thi-h",
    studentName: "Nguyễn Thị H.",
    hometown: "Nghệ An",
    age: 19,
    year: 2025,
    university: "ĐH Chodang",
    major: "Tiếng Hàn",
    visaType: "D-4",
    quote: "Em sang Hàn chỉ sau 4 tháng học tiếng tại Kaizen. Visa đậu ngay lần đầu, ký túc xá sạch sẽ, có chị Việt hỗ trợ tận tình.",
    image: u("photo-1494790108377-be9c29b29330"),
    highlight: "Đậu visa D-4 lần đầu, học bổng 30%",
  },
  {
    slug: "tran-van-t",
    studentName: "Trần Văn T.",
    hometown: "Hà Tĩnh",
    age: 22,
    year: 2024,
    university: "ĐH Koje",
    major: "Cơ khí đóng tàu",
    visaType: "D-2",
    quote: "Tốt nghiệp cao đẳng cơ khí, em sang Koje liên thông đại học. Vừa học vừa làm thêm tại xưởng được 2 triệu won/tháng.",
    image: u("photo-1507003211169-0a1dd7228f2d"),
    highlight: "Liên thông ĐH, thu nhập làm thêm 35 triệu/tháng",
  },
  {
    slug: "le-thi-m",
    studentName: "Lê Thị M.",
    hometown: "Thanh Hoá",
    age: 20,
    year: 2025,
    university: "ĐH Daejeon",
    major: "CNTT",
    visaType: "D-2",
    quote: "Em được Kaizen tư vấn chọn ngành IT vì đang hot tại Hàn. Học bổng trường giảm 40% học phí, sinh hoạt ở Daejeon rất hợp lý.",
    image: u("photo-1438761681033-6461ffad8d80"),
    highlight: "Học bổng IT 40%, dự định ở lại làm việc",
  },
  {
    slug: "pham-van-q",
    studentName: "Phạm Văn Q.",
    hometown: "Nghệ An",
    age: 25,
    year: 2024,
    university: "ĐH Soonchunhyang",
    major: "Thạc sĩ Truyền thông",
    visaType: "D-2",
    quote: "Sau khi làm 2 năm tại Việt Nam, em quyết định học thạc sĩ tại Hàn. GKS toàn phần — gia đình không phải lo gì.",
    image: u("photo-1500648767791-00dcc994a43e"),
    highlight: "Học bổng GKS toàn phần thạc sĩ",
  },
  {
    slug: "vo-thi-l",
    studentName: "Võ Thị L.",
    hometown: "Quảng Bình",
    age: 19,
    year: 2025,
    university: "ĐH Quốc gia Kyungbuk",
    major: "Quản trị kinh doanh",
    visaType: "D-2",
    quote: "Em chọn KNU vì là trường quốc gia, học phí thấp mà bằng cấp giá trị. Daegu nhiều người Việt, không bị lạc lõng.",
    image: u("photo-1517841905240-472988babdf9"),
    highlight: "Đậu trường quốc gia top 10",
  },
  {
    slug: "hoang-van-d",
    studentName: "Hoàng Văn D.",
    hometown: "Nghệ An",
    age: 21,
    year: 2024,
    university: "ĐH Chodang",
    major: "Hàng không",
    visaType: "D-4",
    quote: "Trượt đại học ở Việt Nam, em qua Hàn học lại từ tiếng. Bây giờ đã đậu khoa Hàng không, ước mơ làm tiếp viên thành hiện thực.",
    image: u("photo-1521119989659-a83eee488004"),
    highlight: "Chuyển ngành Hàng không sau 1 năm tiếng",
  },
  {
    slug: "nguyen-thi-p",
    studentName: "Nguyễn Thị P.",
    hometown: "Hà Tĩnh",
    age: 18,
    year: 2026,
    university: "ĐH Soonchunhyang",
    major: "Điều dưỡng",
    visaType: "D-2",
    quote: "Mẹ em làm điều dưỡng. Em theo nghề mẹ nhưng học ở Hàn để có cơ hội định cư sau này. Trường có bệnh viện riêng để thực tập.",
    image: u("photo-1573497019940-1c28c88b4f3e"),
    highlight: "Khai giảng kỳ Spring 2026, học bổng 50%",
  },
  {
    slug: "le-van-k",
    studentName: "Lê Văn K.",
    hometown: "Nghệ An",
    age: 23,
    year: 2024,
    university: "ĐH Koje",
    major: "Du học nghề — Hàn nông nghiệp",
    visaType: "D-4",
    quote: "Hoàn cảnh gia đình khó khăn, em chọn du học nghề tại Koje. Vừa học vừa làm tại trang trại, gửi về cho mẹ 20 triệu/tháng.",
    image: u("photo-1500648767791-00dcc994a43e"),
    highlight: "Du học nghề, gửi về 20 triệu/tháng",
  },
];
