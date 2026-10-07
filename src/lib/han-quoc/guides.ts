export type GuideCategory = "visa" | "ho-so" | "phong-van" | "hanh-ly" | "nganh-hoc";

export type GuideSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  summary: string;
  category: GuideCategory;
  keyword: string;
  metaDescription: string;
  heroImage: string;
  readingTime: number; // minutes
  updatedAt: string;
  sections: GuideSection[];
};

export const CATEGORY_LABEL: Record<GuideCategory, string> = {
  visa: "Visa",
  "ho-so": "Hồ sơ",
  "phong-van": "Phỏng vấn",
  "hanh-ly": "Hành lý",
  "nganh-hoc": "Ngành học",
};

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export const HAN_QUOC_GUIDES: Guide[] = [
  {
    slug: "visa-d2-han-quoc",
    title: "Visa D2 Hàn Quốc 2026: điều kiện, hồ sơ, quy trình",
    summary: "Hướng dẫn chi tiết visa D2 Hàn Quốc cho hệ cao đẳng, đại học, thạc sĩ và tiến sĩ.",
    category: "visa",
    keyword: "visa D2 Hàn Quốc",
    metaDescription: "Visa D2 Hàn Quốc 2026: điều kiện, hồ sơ, lệ phí và quy trình xin visa du học hệ đại học, thạc sĩ. Kaizen hỗ trợ tỷ lệ đậu 98%.",
    heroImage: u("photo-1554224155-6726b3ff858f"),
    readingTime: 6,
    updatedAt: "2026-06-01",
    sections: [
      {
        heading: "Visa D2 Hàn Quốc là gì?",
        paragraphs: [
          "Visa D-2 là loại visa du học chính quy do Đại sứ quán Hàn Quốc cấp cho sinh viên quốc tế theo học chương trình cao đẳng (D-2-1), đại học (D-2-2), thạc sĩ (D-2-3), tiến sĩ (D-2-4), trao đổi (D-2-6) hoặc nghiên cứu (D-2-5).",
          "Thời hạn visa D-2 thường từ 1–2 năm và được gia hạn tại Hàn Quốc đến hết chương trình học.",
        ],
      },
      {
        heading: "Điều kiện xin visa D2",
        bullets: [
          "Đã tốt nghiệp THPT (đối với D-2-2) hoặc đại học (đối với D-2-3, D-2-4).",
          "Thời gian tốt nghiệp không quá 3 năm tính từ ngày nộp hồ sơ.",
          "Chứng minh năng lực tiếng: TOPIK 3 trở lên hoặc IELTS 5.5 (chương trình tiếng Anh).",
          "Chứng minh tài chính: sổ tiết kiệm tối thiểu 20.000 USD đứng tên phụ huynh, mở trước 1 tháng.",
          "Không có tiền án, tiền sự; sức khỏe đạt yêu cầu.",
        ],
      },
      {
        heading: "Hồ sơ visa D2 cần chuẩn bị",
        bullets: [
          "Hộ chiếu còn hạn ≥ 18 tháng.",
          "Đơn xin visa (mẫu của LSQ Hàn Quốc).",
          "Thư mời nhập học (COE) do trường Hàn Quốc cấp.",
          "Bằng tốt nghiệp, học bạ, bảng điểm — dịch công chứng + hợp pháp hoá lãnh sự.",
          "Chứng chỉ TOPIK/IELTS bản gốc.",
          "Sổ tiết kiệm ≥ 20.000 USD + giấy xác nhận số dư.",
          "Giấy khám sức khỏe quốc tế (đặc biệt là xét nghiệm lao tại bệnh viện được Hàn Quốc chỉ định).",
          "Lý lịch tư pháp số 2.",
        ],
      },
      {
        heading: "Quy trình xin visa D2 2026",
        bullets: [
          "Bước 1: Nộp hồ sơ apply trường — nhận COE (3–6 tuần).",
          "Bước 2: Khám sức khỏe — lấy lý lịch tư pháp (1 tuần).",
          "Bước 3: Nộp hồ sơ visa tại LSQ Hàn Quốc (Hà Nội hoặc TP.HCM).",
          "Bước 4: Phỏng vấn (nếu được yêu cầu).",
          "Bước 5: Nhận kết quả visa sau 2–4 tuần.",
        ],
      },
      {
        heading: "Lệ phí và thời gian xử lý",
        paragraphs: [
          "Lệ phí visa D-2 năm 2026 khoảng 1.300.000 VNĐ (visa 1 lần) hoặc 1.700.000 VNĐ (visa nhiều lần). Thời gian xử lý 2–4 tuần làm việc tại LSQ.",
          "Kaizen hỗ trợ trọn gói từ apply trường đến nhận visa, tỷ lệ đậu visa D-2 trong 3 năm gần nhất đạt 98%.",
        ],
      },
    ],
  },
  {
    slug: "visa-d4-han-quoc",
    title: "Visa D4 Hàn Quốc 2026: học tiếng Hàn & gia hạn",
    summary: "Visa D4 dành cho học viên tiếng Hàn — điều kiện, hồ sơ, gia hạn và chuyển sang D2.",
    category: "visa",
    keyword: "visa D4 Hàn Quốc",
    metaDescription: "Visa D4 Hàn Quốc 2026: điều kiện, hồ sơ, gia hạn và chuyển đổi sang visa D2. Tỷ lệ đậu visa D-4 tại Kaizen đạt 98%.",
    heroImage: u("photo-1538485399081-7c8970e22338"),
    readingTime: 5,
    updatedAt: "2026-06-01",
    sections: [
      {
        heading: "Visa D4 Hàn Quốc là gì?",
        paragraphs: [
          "Visa D-4 (D-4-1: học tiếng tại đại học, D-4-6: du học nghề) cấp cho học viên theo học tại trung tâm tiếng Hàn của các trường đại học. Thời hạn ban đầu 6 tháng, gia hạn tới 2 năm.",
        ],
      },
      {
        heading: "Điều kiện xin visa D4",
        bullets: [
          "Tốt nghiệp THPT trở lên, ra trường không quá 3 năm.",
          "Độ tuổi 18–25 (linh hoạt theo trường).",
          "GPA cấp 3 từ 6.5 trở lên.",
          "Chứng minh tài chính: sổ tiết kiệm 10.000–20.000 USD (tuỳ trường, tuỳ diện visa thẳng/thường).",
          "Sức khỏe tốt, không tiền án.",
        ],
      },
      {
        heading: "Hồ sơ visa D4",
        bullets: [
          "Hộ chiếu, đơn xin visa, ảnh 3.5×4.5.",
          "COE (giấy nhập học) do trường Hàn cấp.",
          "Bằng tốt nghiệp THPT, học bạ — dịch công chứng + hợp pháp hoá.",
          "Sổ tiết kiệm + xác nhận số dư.",
          "Giấy khám sức khỏe quốc tế tại bệnh viện chỉ định.",
          "Lý lịch tư pháp số 2.",
          "Giấy chứng nhận quan hệ nhân thân (giấy khai sinh, sổ hộ khẩu).",
        ],
      },
      {
        heading: "Trường visa thẳng vs trường thường",
        paragraphs: [
          "Trường visa thẳng (top 1% do Bộ Tư pháp Hàn xếp hạng) yêu cầu chứng minh tài chính thấp hơn (~10.000 USD), không phỏng vấn, tỷ lệ đậu trên 95%. Các trường đối tác Kaizen như Chodang, Daejeon, Soonchunhyang đều thuộc nhóm visa thẳng.",
          "Trường thường yêu cầu sổ tiết kiệm 20.000 USD và có thể bị phỏng vấn tại LSQ.",
        ],
      },
      {
        heading: "Gia hạn D4 và chuyển sang D2",
        bullets: [
          "Gia hạn D-4 mỗi 6 tháng tại Cục xuất nhập cảnh Hàn Quốc, yêu cầu tỷ lệ chuyên cần ≥ 70%.",
          "Sau 1–2 năm học tiếng, đạt TOPIK 3 → chuyển sang visa D-2 để học đại học chính quy.",
          "Hồ sơ chuyển đổi nộp trực tiếp tại Hàn — không cần về Việt Nam.",
        ],
      },
    ],
  },
  {
    slug: "ho-so-du-hoc-han-quoc",
    title: "Hồ sơ du học Hàn Quốc cần những gì?",
    summary: "Checklist đầy đủ hồ sơ du học Hàn Quốc 2026 — từ giấy tờ cá nhân đến tài chính.",
    category: "ho-so",
    keyword: "hồ sơ du học Hàn Quốc",
    metaDescription: "Checklist đầy đủ hồ sơ du học Hàn Quốc 2026: giấy tờ cá nhân, học vấn, tài chính, sức khỏe. Tải mẫu miễn phí cùng Kaizen.",
    heroImage: u("photo-1568667256549-094345857637"),
    readingTime: 5,
    updatedAt: "2026-06-01",
    sections: [
      {
        heading: "Nhóm 1: Giấy tờ cá nhân",
        bullets: [
          "Hộ chiếu còn hạn tối thiểu 18 tháng.",
          "Ảnh thẻ 3.5×4.5 (10 ảnh, nền trắng, chụp trong 6 tháng).",
          "CMND/CCCD bản gốc + 4 bản sao công chứng.",
          "Giấy khai sinh bản sao trích lục mới.",
          "Sổ hộ khẩu (hoặc giấy xác nhận cư trú thay thế từ 2023).",
        ],
      },
      {
        heading: "Nhóm 2: Hồ sơ học vấn",
        bullets: [
          "Bằng tốt nghiệp THPT/Trung cấp/Cao đẳng/Đại học — dịch công chứng tiếng Hàn hoặc tiếng Anh.",
          "Học bạ THPT đầy đủ 3 năm.",
          "Bảng điểm Cao đẳng/Đại học (nếu apply D-2-3, D-2-4).",
          "Chứng chỉ TOPIK (D-2 cần TOPIK 3+, D-4 không bắt buộc).",
          "Tất cả giấy tờ phải hợp pháp hoá lãnh sự tại Bộ Ngoại giao.",
        ],
      },
      {
        heading: "Nhóm 3: Hồ sơ tài chính",
        bullets: [
          "Sổ tiết kiệm 10.000–20.000 USD đứng tên phụ huynh, mở trước 1 tháng.",
          "Giấy xác nhận số dư ngân hàng — bản tiếng Anh.",
          "Giấy chứng nhận quyền sở hữu nhà đất/xe (nếu có) để bổ sung chứng minh tài chính.",
          "Giấy xác nhận thu nhập của bố mẹ (giấy đăng ký kinh doanh, hợp đồng lao động, sổ thuế).",
        ],
      },
      {
        heading: "Nhóm 4: Hồ sơ sức khỏe & lý lịch",
        bullets: [
          "Giấy khám sức khỏe quốc tế (yêu cầu xét nghiệm lao tại bệnh viện được Hàn Quốc chỉ định).",
          "Lý lịch tư pháp số 2 — xin tại Sở Tư pháp tỉnh, có hiệu lực 6 tháng.",
        ],
      },
      {
        heading: "Lưu ý quan trọng",
        paragraphs: [
          "Tất cả giấy tờ tiếng Việt phải được dịch sang tiếng Hàn (hoặc tiếng Anh tuỳ trường) bởi công ty dịch thuật được công nhận, sau đó công chứng tư pháp và hợp pháp hoá lãnh sự. Kaizen hỗ trợ trọn gói khâu này, thời gian 7–10 ngày.",
        ],
      },
    ],
  },
  {
    slug: "phong-van-visa-han-quoc",
    title: "Bí quyết phỏng vấn visa LSQ Hàn Quốc đậu ngay lần đầu",
    summary: "10 câu hỏi phỏng vấn visa du học Hàn Quốc phổ biến nhất + cách trả lời chuẩn.",
    category: "phong-van",
    keyword: "phỏng vấn visa Hàn Quốc",
    metaDescription: "Bí quyết phỏng vấn visa du học Hàn Quốc: 10 câu hỏi phổ biến, cách trả lời, lưu ý ăn mặc & tâm lý. Kaizen hỗ trợ luyện phỏng vấn 1-1.",
    heroImage: u("photo-1521791136064-7986c2920216"),
    readingTime: 6,
    updatedAt: "2026-06-01",
    sections: [
      {
        heading: "Khi nào bị phỏng vấn?",
        paragraphs: [
          "LSQ Hàn Quốc gọi phỏng vấn ngẫu nhiên khoảng 20–30% hồ sơ, tập trung vào: hồ sơ trường thường (không phải visa thẳng), học viên có điểm GPA thấp, gap year dài (>2 năm), hoặc nghi vấn tài chính.",
        ],
      },
      {
        heading: "10 câu hỏi phỏng vấn phổ biến",
        bullets: [
          "Vì sao bạn chọn Hàn Quốc, không phải Nhật/Đài/Trung?",
          "Vì sao chọn trường này, ngành này?",
          "Bạn dự định học bao lâu? Sau khi tốt nghiệp làm gì?",
          "Gia đình bạn làm gì? Thu nhập bao nhiêu?",
          "Ai sẽ chi trả học phí cho bạn?",
          "Bạn đã đi nước ngoài chưa? Có người thân ở Hàn không?",
          "Bạn biết gì về trường và thành phố bạn sẽ học?",
          "Bạn đã học tiếng Hàn bao lâu? Trình độ TOPIK?",
          "Sau tốt nghiệp bạn có ý định ở lại Hàn làm việc không?",
          "Nếu bị từ chối visa lần này, bạn sẽ làm gì?",
        ],
      },
      {
        heading: "Nguyên tắc trả lời",
        bullets: [
          "Trả lời ngắn gọn, đúng trọng tâm — không vòng vo, không thuộc lòng.",
          "Thể hiện mục tiêu học tập rõ ràng — không bộc lộ ý định ở lại lao động.",
          "Câu trả lời nhất quán với hồ sơ đã nộp (đặc biệt là tài chính).",
          "Nói tiếng Việt nếu được phép — không bắt buộc nói tiếng Hàn.",
          "Bình tĩnh, lịch sự, cười nhẹ, eye contact tốt.",
        ],
      },
      {
        heading: "Trang phục & tác phong",
        bullets: [
          "Nam: áo sơ mi trắng/xanh nhạt, quần tây, giày da. Tóc gọn.",
          "Nữ: sơ mi/áo blouse kín cổ, quần tây hoặc váy chữ A đến gối. Trang điểm nhẹ.",
          "Không mặc jeans, áo phông, dép lê.",
          "Đến trước 30 phút, mang đủ giấy tờ gốc.",
        ],
      },
      {
        heading: "Hỗ trợ từ Kaizen",
        paragraphs: [
          "Kaizen tổ chức buổi luyện phỏng vấn 1-1 với chuyên gia có 10+ năm kinh nghiệm xử lý hồ sơ LSQ. Bạn sẽ được mô phỏng phỏng vấn thật, ghi hình lại để sửa lỗi.",
        ],
      },
    ],
  },
  {
    slug: "hanh-ly-du-hoc-han-quoc",
    title: "Checklist hành lý du học Hàn Quốc 2026 — đầy đủ nhất",
    summary: "Danh sách hành lý du học Hàn Quốc theo mùa, theo trọng lượng — không thiếu, không thừa.",
    category: "hanh-ly",
    keyword: "hành lý du học Hàn Quốc",
    metaDescription: "Checklist hành lý du học Hàn Quốc 2026: giấy tờ, quần áo theo mùa, đồ điện tử, thuốc men. Mẹo đóng gói tiết kiệm cùng Kaizen.",
    heroImage: u("photo-1581553680321-4fffae59fccd"),
    readingTime: 5,
    updatedAt: "2026-06-01",
    sections: [
      {
        heading: "Quy định hành lý của hãng bay",
        paragraphs: [
          "Đa số hãng bay sang Hàn Quốc (Vietjet, Vietnam Airlines, Asiana, Korean Air, Jeju Air) cho phép 23kg ký gửi + 7kg xách tay với vé thường. Vé Vietjet du học có thể tăng lên 30–40kg ký gửi — kiểm tra khi đặt vé.",
        ],
      },
      {
        heading: "1. Giấy tờ — XÁCH TAY",
        bullets: [
          "Hộ chiếu có visa.",
          "Giấy nhập học (COE), giấy xác nhận đặt KTX.",
          "Bằng tốt nghiệp, học bạ bản gốc (đã hợp pháp hoá).",
          "5–10 ảnh thẻ 3.5×4.5.",
          "Tiền mặt: 500–1.000 USD hoặc tương đương KRW.",
          "Thẻ ATM Việt Nam kích hoạt giao dịch quốc tế.",
        ],
      },
      {
        heading: "2. Quần áo theo mùa",
        bullets: [
          "Sang vào mùa Xuân (3–5)/Thu (9–11): áo khoác mỏng, áo len, jeans, sneaker.",
          "Sang vào mùa Đông (12–2): chỉ cần áo khoác mỏng để di chuyển. Áo phao dày, găng tay, mũ len mua tại Hàn rẻ và đẹp hơn.",
          "Đồ lót, tất: mang đủ dùng 2 tuần đầu.",
          "1 bộ áo dài/vest cho dịp lễ.",
        ],
      },
      {
        heading: "3. Đồ điện tử",
        bullets: [
          "Laptop + sạc (rất cần thiết).",
          "Điện thoại + sạc + tai nghe.",
          "Ổ cắm chuyển đổi 2 chấu tròn (Hàn dùng chân cắm Type C/F).",
          "Pin sạc dự phòng (≤ 20.000mAh, để xách tay).",
        ],
      },
      {
        heading: "4. Thuốc cá nhân",
        bullets: [
          "Thuốc cảm cúm, hạ sốt, đau bụng, dị ứng — mua tại VN rẻ hơn.",
          "Thuốc đặc trị (nếu có bệnh nền) — kèm đơn thuốc tiếng Anh.",
          "Băng cá nhân, miếng dán hạ sốt.",
        ],
      },
      {
        heading: "5. Đồ dùng nên mang từ VN",
        bullets: [
          "Mì gói, ruốc, cà phê G7 — 5–7kg để dùng tuần đầu.",
          "Gia vị: nước mắm, tương ớt, hạt nêm (đóng gói kỹ).",
          "Bộ nồi cơm điện mini (nếu KTX cho nấu).",
          "Quà nhỏ tặng thầy cô/bạn bè Hàn: cà phê, kẹo dừa, tranh thêu.",
        ],
      },
      {
        heading: "Đồ KHÔNG nên mang",
        bullets: [
          "Chăn ga gối — KTX có sẵn hoặc mua rẻ tại Daiso.",
          "Sách vở dày — mua tại Hàn theo giáo trình của trường.",
          "Mỹ phẩm cồng kềnh — Hàn là thiên đường mỹ phẩm.",
          "Thực phẩm tươi sống — sẽ bị tịch thu ở hải quan.",
        ],
      },
    ],
  },
  {
    slug: "nganh-hoc-hot-han-quoc",
    title: "Top 10 ngành học hot tại Hàn Quốc 2026 — dễ xin việc",
    summary: "10 ngành học có nhu cầu nhân lực cao tại Hàn Quốc, mức lương sau tốt nghiệp.",
    category: "nganh-hoc",
    keyword: "ngành học hot tại Hàn Quốc",
    metaDescription: "Top 10 ngành học hot tại Hàn Quốc 2026: IT, Điều dưỡng, Cơ khí, Truyền thông... Mức lương khởi điểm và cơ hội định cư.",
    heroImage: u("photo-1523240795612-9a054b0db644"),
    readingTime: 6,
    updatedAt: "2026-06-01",
    sections: [
      {
        heading: "Tiêu chí chọn ngành",
        paragraphs: [
          "Khi du học Hàn Quốc, nên chọn ngành thoả mãn 3 tiêu chí: (1) phù hợp năng lực và đam mê, (2) thị trường lao động Hàn đang thiếu nhân lực, (3) có khả năng xin visa làm việc E-7 sau tốt nghiệp.",
        ],
      },
      {
        heading: "Top 10 ngành hot",
        bullets: [
          "1. Công nghệ thông tin / AI — lương khởi điểm 2.800–3.500 USD/tháng.",
          "2. Điều dưỡng — thiếu nhân lực trầm trọng, dễ xin visa E-7.",
          "3. Cơ khí — đóng tàu, ô tô (Samsung, Hyundai, Kia).",
          "4. Truyền thông quốc tế — K-content, K-pop, OTT.",
          "5. Quản trị khách sạn — du lịch Hàn bùng nổ sau COVID.",
          "6. Mỹ phẩm — Công nghệ làm đẹp Hàn dẫn đầu thế giới.",
          "7. Logistics — cảng Busan top 5 thế giới.",
          "8. Năng lượng tái tạo — Hàn đầu tư mạnh điện hạt nhân, hydrogen.",
          "9. Kỹ thuật ô tô điện — Hyundai, Kia chiếm 6% thị phần toàn cầu.",
          "10. Y học cổ truyền (Hanbang) — đặc sản của Hàn.",
        ],
      },
      {
        heading: "Cơ hội định cư sau tốt nghiệp",
        paragraphs: [
          "Sau khi tốt nghiệp đại học/thạc sĩ, sinh viên được cấp visa D-10 (tìm việc) trong 6 tháng. Khi tìm được việc tại công ty Hàn, chuyển sang visa E-7 (làm việc chuyên ngành). Sau 3–5 năm làm việc + đạt TOPIK 4 → đủ điều kiện xin visa F-2 (cư trú dài hạn), 5 năm sau xin F-5 (định cư vĩnh viễn).",
        ],
      },
    ],
  },
  {
    slug: "du-hoc-nghe-han-quoc",
    title: "Du học nghề Hàn Quốc 2026: ngành nào dễ xin việc?",
    summary: "Chương trình du học nghề Hàn Quốc (D-2-6, D-4-6) — chi phí thấp, vừa học vừa làm.",
    category: "nganh-hoc",
    keyword: "du học nghề Hàn Quốc",
    metaDescription: "Du học nghề Hàn Quốc 2026: chương trình D-2-6/D-4-6, chi phí, ngành dễ xin việc, mức lương làm thêm. Phù hợp gia đình ngân sách hạn chế.",
    heroImage: u("photo-1581094271901-8022df4466f9"),
    readingTime: 5,
    updatedAt: "2026-06-01",
    sections: [
      {
        heading: "Du học nghề Hàn Quốc là gì?",
        paragraphs: [
          "Du học nghề Hàn Quốc (KSEP — Korea Specialized Exchange Programme) là chương trình hợp tác giữa Bộ Tư pháp Hàn Quốc và các trường cao đẳng nghề, cho phép học viên Việt Nam sang Hàn vừa học chuyên môn (2 năm) vừa làm việc có lương tại doanh nghiệp.",
          "Visa sử dụng: D-2-6 (cao đẳng nghề) hoặc D-4-6 (kết hợp tiếng).",
        ],
      },
      {
        heading: "Ngành du học nghề phổ biến",
        bullets: [
          "Nông nghiệp công nghệ cao — thực tập tại trang trại, lương 1.800.000 KRW/tháng.",
          "Chế biến thực phẩm — nhà máy thuỷ sản, đông lạnh.",
          "Cơ khí — đóng tàu (Geoje, Ulsan), ô tô (Hyundai).",
          "Hàn — Điện tử (Samsung, LG).",
          "Đầu bếp — nhà hàng, khách sạn.",
        ],
      },
      {
        heading: "Điều kiện tham gia",
        bullets: [
          "Tốt nghiệp THPT, tuổi 19–30.",
          "Sức khỏe loại 1/2, không xăm trổ phản cảm.",
          "TOPIK 2 trở lên (hoặc cam kết học tại trường).",
          "Chứng minh tài chính: 5.000–10.000 USD (thấp hơn D-2 chính quy).",
          "Không có tiền án.",
        ],
      },
      {
        heading: "Chi phí và thu nhập",
        bullets: [
          "Phí dịch vụ Kaizen + học phí năm 1: 150–180 triệu VNĐ.",
          "Lương làm thêm năm 1: 1.500.000–1.800.000 KRW/tháng (~28–35 triệu VNĐ).",
          "Lương sau tốt nghiệp + visa E-7: 2.500.000–3.500.000 KRW/tháng (~50–70 triệu VNĐ).",
          "Hoàn vốn trong 12–18 tháng.",
        ],
      },
      {
        heading: "Phù hợp với ai?",
        paragraphs: [
          "Du học nghề Hàn Quốc phù hợp với gia đình ngân sách hạn chế, học viên muốn nhanh kiếm thu nhập, không quá nặng nề về bằng cấp đại học. Sau 2 năm cao đẳng nghề, có thể liên thông lên đại học hệ D-2-2 nếu muốn.",
        ],
      },
    ],
  },
  {
    slug: "chi-phi-du-hoc-han-quoc",
    title: "Chi phí du học Hàn Quốc 2026 từ A–Z",
    summary: "Bảng chi tiết chi phí du học Hàn Quốc 2026: học phí, ký túc xá, sinh hoạt, năm 1.",
    category: "nganh-hoc",
    keyword: "chi phí du học Hàn Quốc",
    metaDescription: "Chi phí du học Hàn Quốc 2026 từ A đến Z: học phí, ký túc xá, sinh hoạt, vé máy bay, bảo hiểm. Tổng chi phí năm đầu chỉ từ 200 triệu.",
    heroImage: u("photo-1551836022-d5d88e9218df"),
    readingTime: 6,
    updatedAt: "2026-06-01",
    sections: [
      {
        heading: "1. Học phí (theo năm)",
        bullets: [
          "Khoá tiếng Hàn tại trường ĐH: 45–65 triệu VNĐ/năm (4 kỳ × 11–16 triệu).",
          "Đại học hệ tư thục: 70–120 triệu VNĐ/năm.",
          "Đại học quốc gia (SNU, KNU, PNU): 45–60 triệu VNĐ/năm.",
          "Thạc sĩ: 80–140 triệu VNĐ/năm.",
          "Cao đẳng nghề (D-2-6): 35–50 triệu VNĐ/năm.",
        ],
      },
      {
        heading: "2. Ký túc xá",
        bullets: [
          "KTX trong trường: 10–18 triệu VNĐ/kỳ (4 tháng).",
          "One-room ngoài: 350.000–550.000 KRW/tháng (~7–11 triệu VNĐ).",
          "Goshiwon (phòng nhỏ): 250.000–400.000 KRW/tháng — rẻ nhất.",
          "Phí điện nước/wifi: 50.000–100.000 KRW/tháng.",
        ],
      },
      {
        heading: "3. Sinh hoạt phí",
        bullets: [
          "Ăn uống: 300.000–500.000 KRW/tháng (nấu ăn tự túc tiết kiệm 40%).",
          "Đi lại: 50.000–80.000 KRW/tháng (thẻ T-money tàu/buýt).",
          "Điện thoại: 20.000–40.000 KRW/tháng.",
          "Phát sinh (giải trí, mua sắm): 100.000–200.000 KRW/tháng.",
          "Tổng sinh hoạt: 10–15 triệu VNĐ/tháng.",
        ],
      },
      {
        heading: "4. Chi phí ban đầu (năm 1)",
        bullets: [
          "Phí dịch vụ Kaizen + xử lý hồ sơ: tư vấn miễn phí.",
          "Vé máy bay 1 chiều: 5–8 triệu VNĐ.",
          "Khám sức khỏe + lý lịch tư pháp: ~2 triệu.",
          "Lệ phí visa: 1,3 triệu.",
          "Dịch thuật + hợp pháp hoá: 3–5 triệu.",
          "Chứng minh tài chính (sổ tiết kiệm phong tỏa): 10.000–20.000 USD (sẽ rút lại sau khi nhập học).",
        ],
      },
      {
        heading: "5. Tổng chi phí năm đầu",
        paragraphs: [
          "Tổng chi phí du học Hàn Quốc năm đầu (chưa tính sổ tiết kiệm phong tỏa): 200–280 triệu VNĐ với trường visa thẳng, 280–400 triệu VNĐ với trường top.",
          "Sinh viên có thể bù đắp 40–60% chi phí thông qua làm thêm 20h/tuần (visa cho phép sau 6 tháng đầu).",
        ],
      },
      {
        heading: "Cách tiết kiệm chi phí",
        bullets: [
          "Săn học bổng GKS, học bổng trường (giảm 30–100% học phí).",
          "Chọn trường tỉnh thay vì Seoul (sinh hoạt rẻ hơn 30%).",
          "Ở KTX trường năm đầu, sau ra ngoài share phòng.",
          "Làm thêm hợp pháp tại nhà hàng, siêu thị, dịch thuật.",
          "Đăng ký lớp tiếng tối + ngày → giảm thời gian học, tiết kiệm tiền KTX.",
        ],
      },
    ],
  },
];

export function getGuide(slug: string) {
  return HAN_QUOC_GUIDES.find((g) => g.slug === slug);
}

export function getGuidesByCategory(category: GuideCategory) {
  return HAN_QUOC_GUIDES.filter((g) => g.category === category);
}
