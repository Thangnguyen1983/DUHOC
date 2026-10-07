import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";


async function assertStaff(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "students.manage");
}

export type DossierIssue = {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  doc_code?: string;
};

export type DossierReview = {
  id: string;
  student_profile_id: string;
  market: string | null;
  completeness_percent: number;
  visa_score: number;
  risk_level: string;
  summary: string | null;
  issues: DossierIssue[];
  suggestions: string[];
  created_at: string;
};

const idInput = z.object({ student_profile_id: z.string().uuid() });

export const listDossierReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { assertStudentDepartment } = await import("@/lib/students/department-access.server");
    await assertStudentDepartment(context, data.student_profile_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("student_dossier_reviews")
      .select("*")
      .eq("student_profile_id", data.student_profile_id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return { reviews: (rows ?? []) as unknown as DossierReview[] };
  });

const SYSTEM_PROMPT = `Bạn là chuyên viên thẩm định hồ sơ du học / xuất khẩu lao động của công ty Kaizen.
Nhiệm vụ: rà soát bộ hồ sơ của một học viên, phát hiện thiếu sót, mâu thuẫn thông tin giữa các giấy tờ,
điểm bất thường có thể khiến trượt visa, và ước lượng khả năng đạt visa.
Chỉ trả về DUY NHẤT một JSON theo cấu trúc:
{
  "completeness_percent": 0-100,
  "visa_score": 0-100,
  "risk_level": "low" | "medium" | "high",
  "summary": "2-4 câu nhận định tổng quan bằng tiếng Việt",
  "issues": [{"severity":"high|medium|low","title":"...","detail":"...","doc_code":"mã giấy tờ nếu có"}],
  "suggestions": ["hành động cụ thể cần làm tiếp, tiếng Việt"]
}
Không markdown, không chú thích ngoài JSON. Viết tiếng Việt tự nhiên, ngắn gọn, đi thẳng vào việc.`;

export const runDossierReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { assertStudentDepartment } = await import("@/lib/students/department-access.server");
    await assertStudentDepartment(context, data.student_profile_id, true);
    const key = "kaizen-external-ai";
    if (!key) throw new Error("Thiếu LOVABLE_API_KEY");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("student_profiles")
      .select(
        "id, full_name, dob, phone, email, country, program, current_status, contract_status, visa_status, departure_status, student_code, meta",
      )
      .eq("id", data.student_profile_id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("Không tìm thấy hồ sơ học viên");

    const [{ data: checklist }, { data: docs }] = await Promise.all([
      supabaseAdmin
        .from("student_document_checklist")
        .select("doc_code, doc_name, is_required, status, note")
        .eq("student_profile_id", data.student_profile_id)
        .order("is_required", { ascending: false })
        .order("sort_order"),
      supabaseAdmin
        .from("student_documents")
        .select("doc_type, file_name, verified, note, created_at")
        .eq("student_profile_id", data.student_profile_id)
        .is("deleted_at", null)
        .limit(200),
    ]);

    const items = checklist ?? [];
    const required = items.filter((i: any) => i.is_required && i.status !== "na");
    const verified = required.filter((i: any) => i.status === "verified").length;
    const localPercent = required.length ? Math.round((verified / required.length) * 100) : 0;

    const payload = {
      hoc_vien: {
        ho_ten: profile.full_name,
        ma_hv: profile.student_code,
        ngay_sinh: profile.dob,
        thi_truong: profile.country,
        chuong_trinh: profile.program,
        trang_thai: profile.current_status,
        hop_dong: profile.contract_status,
        visa: profile.visa_status,
        xuat_canh: profile.departure_status,
        ghi_chu: profile.meta,
      },
      checklist: items,
      tai_lieu_da_tai_len: docs ?? [],
      phan_tram_hoan_thien_he_thong_tinh: localPercent,
    };

    const res = await (await import("@/lib/ai/external-ai.server")).aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(payload) },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (res.status === 429) throw new Error("Hệ thống AI đang quá tải, vui lòng thử lại sau ít phút.");
    if (res.status === 402) throw new Error("Hết credit AI. Vui lòng nạp thêm để tiếp tục.");
    if (!res.ok) throw new Error(`AI lỗi ${res.status}`);

    const json: any = await res.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    let parsed: any = {};
    try {
      parsed = JSON.parse(start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : "{}");
    } catch {
      parsed = {};
    }

    const clamp = (n: any, fallback: number) => {
      const v = Number(n);
      return Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : fallback;
    };

    const row = {
      student_profile_id: data.student_profile_id,
      market: profile.country ?? null,
      completeness_percent: clamp(parsed.completeness_percent, localPercent),
      visa_score: clamp(parsed.visa_score, 0),
      risk_level: ["low", "medium", "high"].includes(parsed.risk_level) ? parsed.risk_level : "medium",
      summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 2000) : null,
      issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 30) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 20) : [],
      model: "google/gemini-3-flash-preview",
      created_by: context.userId,
    };

    const { data: saved, error } = await supabaseAdmin
      .from("student_dossier_reviews")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    return { review: saved as unknown as DossierReview };
  });
