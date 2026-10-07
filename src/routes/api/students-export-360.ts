import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

async function authorize(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { error: "Chưa đăng nhập.", status: 401 as const };
  const token = authHeader.slice("Bearer ".length);
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) return { error: "Backend chưa cấu hình.", status: 500 as const };

  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) return { error: "Phiên đăng nhập không hợp lệ.", status: 401 as const };

  const { hasPermission } = await import("@/lib/rbac/guard");
  const ok = await hasPermission({ supabase, userId: userData.user.id }, "students.export");
  if (!ok) return { error: "Bạn không có quyền xuất hồ sơ.", status: 403 as const };

  return { userId: userData.user.id, email: userData.user.email ?? "", supabase };
}

export const Route = createFileRoute("/api/students-export-360")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authorize(request);
        if ("error" in auth) return Response.json({ error: auth.error }, { status: auth.status });

        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
        }

        const id = String(body?.student_profile_id ?? "");
        const format = String(body?.format ?? "pdf");
        const purpose = String(body?.purpose ?? "archive");
        const note = String(body?.note ?? "").slice(0, 500);
        if (!/^[0-9a-f-]{36}$/i.test(id))
          return Response.json({ error: "Thiếu mã hồ sơ học viên." }, { status: 400 });
        if (!["pdf", "xlsx", "zip"].includes(format))
          return Response.json({ error: "Định dạng không hợp lệ." }, { status: 400 });
        if (!note.trim())
          return Response.json({ error: "Vui lòng ghi lý do xuất hồ sơ." }, { status: 400 });

        const [{ supabaseAdmin }, mod] = await Promise.all([
          import("@/integrations/supabase/client.server"),
          import("@/lib/students/export360.server"),
        ]);

        try {
          const { assertStudentDepartment } = await import("@/lib/students/department-access.server");
          await assertStudentDepartment({ supabase: auth.supabase, userId: auth.userId }, id);
          const dossier = await mod.collectDossier(supabaseAdmin, id);
          const now = new Date();
          const meta = {
            exportedByEmail: auth.email,
            purposeLabel: mod.EXPORT_PURPOSES[purpose] ?? purpose,
            note,
            exportedAt: now,
          };
          const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
          const baseName = `${dossier.studentCode}_${mod.slug(dossier.fullName).toUpperCase()}_360_${stamp}`;

          let bytes: Uint8Array;
          let mime: string;
          if (format === "pdf") {
            bytes = await mod.buildPdf(dossier, meta);
            mime = "application/pdf";
          } else if (format === "xlsx") {
            bytes = await mod.buildXlsx(dossier, meta);
            mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          } else {
            const [pdf, xlsx] = await Promise.all([
              mod.buildPdf(dossier, meta),
              mod.buildXlsx(dossier, meta),
            ]);
            bytes = await mod.buildZip(supabaseAdmin, dossier, meta, pdf, xlsx, baseName);
            mime = "application/zip";
          }

          const ext = format === "xlsx" ? "xlsx" : format;
          const fileName = `${baseName}.${ext}`;
          const sum = await mod.checksum(bytes);

          await supabaseAdmin.from("student_export_logs").insert({
            student_profile_id: id,
            exported_by: auth.userId,
            exported_by_email: auth.email,
            format,
            purpose,
            note,
            file_name: fileName,
            checksum: sum,
            byte_size: bytes.byteLength,
          });

          const { logStudentActivity } = await import("@/lib/students/activity.server");
          await logStudentActivity({
            student_profile_id: id,
            action: "export_360",
            actor_id: auth.userId,
            actor_email: auth.email,
            entity: "student_export_logs",
            field: `Định dạng ${format}`,
            new_value: fileName,
            note: note || purpose,
            meta: { checksum: sum, purpose },
          });



          return new Response(
            bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
            {
              headers: {
                "Content-Type": mime,
                "Content-Disposition": `attachment; filename="${fileName}"`,
                "X-Export-Checksum": sum,
                "X-Export-Filename": fileName,
                "Cache-Control": "no-store",
              },
            },
          );
        } catch (e: any) {
          return Response.json(
            { error: e?.message ?? "Không xuất được hồ sơ." },
            { status: 500 },
          );
        }
      },
    },
  },
});
