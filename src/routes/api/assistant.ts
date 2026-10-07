import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const SYSTEM = `Bạn là Trợ lý Kaizen, trợ lý ảo nội bộ của công ty Kaizen (du học, xuất khẩu lao động, đào tạo ngoại ngữ).
Nhiệm vụ: hướng dẫn quy trình, tra cứu số liệu trong phạm vi quyền của người hỏi, và soạn thảo (email, tin nhắn, tóm tắt hồ sơ, báo cáo ngắn).
Quy tắc:
- Luôn trả lời tiếng Việt, gọn, câu ngắn. Gọi người dùng là "anh/chị".
- Chỉ dùng số liệu lấy từ công cụ. Không bịa số liệu, không đoán thông tin học viên.
- Khi hướng dẫn, kèm đường dẫn trang (ví dụ /admin/students) để người dùng bấm mở.
- Không hiển thị đầy đủ số điện thoại, CCCD, email của học viên.
- Bạn không tự lưu hay sửa dữ liệu. Bản soạn thảo để người dùng tự sao chép và lưu.
- Nếu công cụ báo không có quyền, nói rõ người dùng chưa được phân quyền phần đó.`;

const mask = (v?: string | null) => (v ? v.replace(/^(.{2}).*(.{3})$/, "$1****$2") : null);

export const Route = createFileRoute("/api/assistant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claims, error: claimErr } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (claimErr || !userId) return new Response("Unauthorized", { status: 401 });
        const ctx = { supabase, userId };

        const { hasPermission } = await import("@/lib/rbac/guard");
        if (!(await hasPermission(ctx, "ai.assistant"))) return new Response("Forbidden", { status: 403 });

        const body = await request.json().catch(() => null);
        const messages = body?.messages as UIMessage[] | undefined;
        const page = typeof body?.page === "string" ? body.page.slice(0, 120) : "";
        if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });

        const { getAiModel, AiConfigError } = await import("@/lib/ai/external-ai.server");
        let model;
        try {
          model = await getAiModel();
        } catch (e) {
          const msg = e instanceof AiConfigError ? e.message : "Chưa cấu hình AI";
          return new Response(JSON.stringify({ error: msg }), { status: 503, headers: { "content-type": "application/json" } });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { studentDepartmentAccess, limitToDepartments } = await import("@/lib/students/department-access.server");

        const tools = {
          huong_dan: tool({
            description: "Tìm hướng dẫn sử dụng và quy trình nghiệp vụ từng bước theo từ khoá.",
            inputSchema: z.object({ tu_khoa: z.string() }),
            execute: async ({ tu_khoa }) => {
              const [{ GUIDES }, { WORKFLOWS }] = await Promise.all([import("@/lib/help/guides"), import("@/lib/help/workflows")]);
              const q = tu_khoa.toLowerCase();
              const hit = (t: string) => t.toLowerCase().includes(q) || q.split(/\s+/).some((w) => w.length > 2 && t.toLowerCase().includes(w));
              const guides = GUIDES.filter((g) => hit(`${g.title} ${g.summary}`)).slice(0, 4)
                .map((g) => ({ loai: "Hướng dẫn", tieu_de: g.title, tom_tat: g.summary, trang: g.paths?.[0], cac_buoc: g.sections.flatMap((s) => (s as any).steps ?? []).slice(0, 8) }));
              const flows = WORKFLOWS.filter((w) => hit(`${w.title} ${w.summary}`)).slice(0, 3)
                .map((w) => ({ loai: "Quy trình", tieu_de: w.title, tom_tat: w.summary, trang: `/admin/huong-dan/quy-trinh/${w.slug}`, cac_buoc: w.steps.map((s: any) => s.title) }));
              return [...flows, ...guides];
            },
          }),
          tim_hoc_vien: tool({
            description: "Tìm hồ sơ học viên theo tên, mã học viên hoặc số điện thoại, trong phạm vi phòng ban của người hỏi.",
            inputSchema: z.object({ tu_khoa: z.string() }),
            execute: async ({ tu_khoa }) => {
              if (!(await hasPermission(ctx, "students.view"))) return { loi: "Không có quyền xem hồ sơ học viên" };
              const scope = await studentDepartmentAccess(ctx);
              const s = tu_khoa.replace(/[%_,()]/g, "").slice(0, 60);
              const { data } = await limitToDepartments(supabaseAdmin.from("student_profiles")
                .select("id, student_code, full_name, phone, country, program, program_type, current_status, collaborator_code")
                .is("deleted_at", null)
                .or(`full_name.ilike.%${s}%,student_code.ilike.%${s}%,phone.ilike.%${s}%`)
                .limit(10), scope);
              return (data ?? []).map((r: any) => ({ ...r, phone: mask(r.phone), trang: `/admin/students/${r.id}` }));
            },
          }),
          thong_ke: tool({
            description: "Số liệu tổng quan trong phạm vi quyền: hồ sơ học viên theo trạng thái/loại hình, lead theo trạng thái, hoa hồng cộng tác viên.",
            inputSchema: z.object({}),
            execute: async () => {
              const out: Record<string, unknown> = {};
              if (await hasPermission(ctx, "students.view")) {
                const scope = await studentDepartmentAccess(ctx);
                const { data } = await limitToDepartments(supabaseAdmin.from("student_profiles")
                  .select("current_status, program_type").is("deleted_at", null).limit(5000), scope);
                const byStatus: Record<string, number> = {}; const byType: Record<string, number> = {};
                for (const r of data ?? []) { byStatus[r.current_status] = (byStatus[r.current_status] ?? 0) + 1; byType[r.program_type ?? "chưa phân loại"] = (byType[r.program_type ?? "chưa phân loại"] ?? 0) + 1; }
                out.hoc_vien = { tong: data?.length ?? 0, theo_trang_thai: byStatus, theo_loai_hinh: byType };
              }
              if (await hasPermission(ctx, "leads.view")) {
                const { data } = await supabaseAdmin.from("consultations").select("status").limit(5000);
                const by: Record<string, number> = {};
                for (const r of data ?? []) by[r.status ?? "new"] = (by[r.status ?? "new"] ?? 0) + 1;
                out.lead = { tong: data?.length ?? 0, theo_trang_thai: by };
              }
              if (await hasPermission(ctx, "commissions.view")) {
                const { data } = await supabaseAdmin.from("collaborator_commissions").select("status, commission_amount, order_revenue");
                const t = { doanh_thu: 0, hoa_hong: 0, da_tra: 0, cho_tra: 0 };
                for (const r of data ?? []) { if (r.status === "cancelled") continue; t.doanh_thu += +r.order_revenue; t.hoa_hong += +r.commission_amount; if (r.status === "paid") t.da_tra += +r.commission_amount; else t.cho_tra += +r.commission_amount; }
                out.hoa_hong_ctv_vnd = t;
              }
              return Object.keys(out).length ? out : { loi: "Chưa có quyền xem số liệu nào" };
            },
          }),
        };

        const result = streamText({
          model,
          system: `${SYSTEM}\nTrang người dùng đang mở: ${page || "không rõ"}.`,
          messages: await convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(50),
        });
        return result.toUIMessageStreamResponse({
          onError: () => "Trợ lý tạm thời không phản hồi. Kiểm tra Cài đặt AI hoặc thử lại sau.",
        });
      },
    },
  },
});
