import { COMPANY, MARKETS } from "@/lib/markets";
import { STUDY_COUNTRIES } from "@/lib/study-countries";

/** Knowledge base tĩnh build từ dữ liệu code (luôn có, không cần admin nạp). */
export function buildStaticKnowledge(): string {
  const company = `# Về KAIZEN
- Tên: ${COMPANY.name} (${COMPANY.short})
- Slogan: ${COMPANY.slogan}
- Hotline/Zalo: ${COMPANY.phone}
- Email: ${COMPANY.email}
- Địa chỉ: ${COMPANY.address}
- MST: ${COMPANY.taxId}
- Lĩnh vực: Du học, Xuất khẩu lao động (XKLĐ), Đào tạo ngoại ngữ, Outsourcing nhân lực, Du lịch & Visa.`;

  const xkld = Object.values(MARKETS)
    .map(
      (m) => `## XKLĐ ${m.name} ${m.flag}
- Tagline: ${m.tagline}
- Mô tả: ${m.description}
- Điểm nổi bật:
${m.highlights.map((h) => `  - ${h}`).join("\n")}`,
    )
    .join("\n\n");

  const duhoc = Object.values(STUDY_COUNTRIES)
    .map(
      (c) => `## Du học ${c.name} ${c.flag}
- Tagline: ${c.tagline}
- Mô tả: ${c.description}
- Chương trình: ${c.programs.map((p) => p.name).join(", ")}
- Yêu cầu chính: ${c.requirements.slice(0, 3).join("; ")}`,
    )
    .join("\n\n");

  return `${company}

# Thị trường XKLĐ
${xkld}

# Du học các nước
${duhoc}

# Dịch vụ khác
- Ngoại ngữ: Tiếng Nhật, Hàn, Trung, Đức, Anh — luyện thi JLPT, TOPIK, HSK, IELTS.
- Outsourcing: Cung ứng & cho thuê nhân lực ngắn/dài hạn cho doanh nghiệp.
- Du lịch & Visa: Tư vấn visa du lịch, công tác, thăm thân các nước.`;
}
