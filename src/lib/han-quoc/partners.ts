export type Partner = {
  slug: string;
  name: string;
  shortName: string;
  city: string;
  established: number;
  type: "Quốc gia" | "Tư thục";
  heroImage: string;
  tagline: string;
  summary: string;
  strengths: string[];
  majors: string[];
  tuition: string; // VND/year
  dorm: string;
  scholarship: string;
  ranking?: string;
  visaType: "D-2" | "D-4" | "D-2 / D-4";
};

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export const HAN_QUOC_PARTNERS: Partner[] = [
  {
    slug: "koje",
    name: "Đại học Koje (Koje College)",
    shortName: "ĐH Koje",
    city: "Geoje, Gyeongnam",
    established: 1995,
    type: "Tư thục",
    heroImage: u("photo-1517022812141-23620dba5c23"),
    tagline: "Trường tốp đầu đảo Geoje, mạnh về kỹ thuật đóng tàu & cơ khí",
    summary:
      "Koje College nằm tại đảo Geoje — trung tâm công nghiệp đóng tàu lớn nhất Hàn Quốc. Trường liên kết chặt với Samsung Heavy Industries và Daewoo Shipbuilding, sinh viên có cơ hội thực tập hưởng lương và việc làm sau tốt nghiệp rất cao.",
    strengths: [
      "Học bổng tiếng Hàn 30–50% năm đầu cho học viên Kaizen",
      "Ký túc xá trong khuôn viên, an ninh tốt",
      "Cộng đồng sinh viên Việt Nam đông, hỗ trợ tận tình",
      "Cách Busan 1 giờ — tiện đi làm thêm cuối tuần",
    ],
    majors: ["Đóng tàu & Hàng hải", "Cơ khí chế tạo", "Quản trị du lịch", "Tiếng Hàn"],
    tuition: "55 – 65 triệu VNĐ/năm",
    dorm: "12 – 15 triệu VNĐ/kỳ",
    scholarship: "Học bổng TOPIK 2–4: giảm 30–70% học phí",
    visaType: "D-2 / D-4",
  },
  {
    slug: "chodang",
    name: "Đại học Chodang (Chodang University)",
    shortName: "ĐH Chodang",
    city: "Muan, Jeollanam",
    established: 1994,
    type: "Tư thục",
    heroImage: u("photo-1562774053-701939374585"),
    tagline: "Trường visa thẳng, học phí mềm, dễ xin học bổng đầu vào",
    summary:
      "Chodang University thuộc tỉnh Jeollanam, được Bộ Tư pháp Hàn Quốc cấp chứng nhận visa thẳng (trường top 1%). Sinh viên Kaizen sang Chodang có tỷ lệ đậu visa D-4 trên 98% trong 3 năm gần nhất.",
    strengths: [
      "Visa thẳng — hồ sơ đơn giản, không cần phỏng vấn LSQ",
      "Học phí thấp nhất nhóm trường liên kết (~50 triệu/năm)",
      "Ký túc xá mới, có bếp tự nấu",
      "Hỗ trợ giới thiệu việc làm thêm 5.000–7.000 KRW/giờ",
    ],
    majors: ["Hàng không", "Cảnh sát", "Điều dưỡng", "Khách sạn — Du lịch", "Tiếng Hàn"],
    tuition: "48 – 58 triệu VNĐ/năm",
    dorm: "10 – 13 triệu VNĐ/kỳ",
    scholarship: "Giảm 30% học phí năm 1 cho học viên Kaizen",
    visaType: "D-4",
  },
  {
    slug: "daejeon",
    name: "Đại học Daejeon (Daejeon University)",
    shortName: "ĐH Daejeon",
    city: "Daejeon",
    established: 1980,
    type: "Tư thục",
    heroImage: u("photo-1523050854058-8df90110c9f1"),
    tagline: "Trường top 30 Hàn Quốc, mạnh về Y dược cổ truyền và IT",
    summary:
      "Daejeon University là một trong những đại học tổng hợp lớn ở miền Trung Hàn Quốc, nổi tiếng về Y học cổ truyền Hàn Quốc (Hanbang) và Công nghệ thông tin. Thành phố Daejeon là trung tâm khoa học công nghệ — chi phí sinh hoạt thấp hơn Seoul 30%.",
    strengths: [
      "Top 30 trường đại học Hàn Quốc",
      "Visa thẳng — hồ sơ visa D-2 nhanh gọn",
      "Đa dạng ngành học thạc sĩ/tiến sĩ tiếng Anh",
      "Cộng đồng SV quốc tế 1.000+ từ 40 quốc gia",
    ],
    majors: ["Y dược cổ truyền", "Công nghệ thông tin", "Quản trị kinh doanh", "Kiến trúc", "Tiếng Hàn"],
    tuition: "65 – 85 triệu VNĐ/năm",
    dorm: "13 – 16 triệu VNĐ/kỳ",
    scholarship: "Học bổng đầu vào 20–50% theo GPA + TOPIK",
    ranking: "Top 30 Hàn Quốc",
    visaType: "D-2 / D-4",
  },
  {
    slug: "soonchunhyang",
    name: "Đại học Soonchunhyang (SCH University)",
    shortName: "ĐH Soonchunhyang",
    city: "Asan, Chungnam",
    established: 1978,
    type: "Tư thục",
    heroImage: u("photo-1498243691581-b145c3f54a5a"),
    tagline: "Top 20 Hàn Quốc, mạnh Y khoa và Truyền thông",
    summary:
      "Soonchunhyang University (SCH) là một trong những đại học có bệnh viện đại học lớn nhất Hàn Quốc với 5 bệnh viện vệ tinh. Trường liên tục lọt top 20 đại học toàn quốc, có chương trình tiếng Anh dành cho sinh viên quốc tế và học bổng GKS hằng năm.",
    strengths: [
      "Top 20 đại học Hàn Quốc (xếp hạng QS Asia)",
      "Học bổng GKS — toàn phần học phí + sinh hoạt",
      "Bệnh viện đại học cho SV ngành Y/Điều dưỡng thực tập",
      "Cách Seoul 90 phút bằng tàu cao tốc KTX",
    ],
    majors: ["Y khoa", "Điều dưỡng", "Truyền thông quốc tế", "Công nghệ sinh học", "Tiếng Hàn"],
    tuition: "70 – 95 triệu VNĐ/năm",
    dorm: "14 – 18 triệu VNĐ/kỳ",
    scholarship: "GKS, học bổng trường 30–100% theo TOPIK & GPA",
    ranking: "Top 20 Hàn Quốc",
    visaType: "D-2 / D-4",
  },
  {
    slug: "kyungbuk",
    name: "Đại học Quốc gia Kyungbuk (KNU)",
    shortName: "ĐH Quốc gia Kyungbuk",
    city: "Daegu",
    established: 1946,
    type: "Quốc gia",
    heroImage: u("photo-1541339907198-e08756dedf3f"),
    tagline: "Đại học Quốc gia top 10 Hàn Quốc, học phí ưu đãi",
    summary:
      "Kyungbuk National University (KNU) là một trong 10 đại học quốc gia hàng đầu Hàn Quốc, đứng thứ 7 toàn quốc về nghiên cứu khoa học. Là đại học quốc gia nên học phí thấp hơn 30–40% so với trường tư thục cùng đẳng cấp.",
    strengths: [
      "Top 10 đại học Hàn Quốc — bằng cấp giá trị cao",
      "Học phí quốc gia ưu đãi (~45 triệu/năm)",
      "Học bổng GKS, BK21 cho sau đại học",
      "Daegu — thành phố lớn thứ 4 Hàn, nhiều việc làm thêm",
    ],
    majors: ["Kỹ thuật điện — điện tử", "IT & AI", "Quản trị kinh doanh", "Nông nghiệp công nghệ cao", "Tiếng Hàn"],
    tuition: "45 – 60 triệu VNĐ/năm",
    dorm: "10 – 14 triệu VNĐ/kỳ",
    scholarship: "GKS, BK21, học bổng trường 50–100%",
    ranking: "Top 10 Hàn Quốc",
    visaType: "D-2 / D-4",
  },
];

export function getPartner(slug: string) {
  return HAN_QUOC_PARTNERS.find((p) => p.slug === slug);
}
