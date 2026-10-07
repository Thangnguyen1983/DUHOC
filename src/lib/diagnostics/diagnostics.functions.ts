import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission } from "@/lib/rbac/guard";

export type CheckStatus = "pass" | "warn" | "fail";
export type CheckResult = { group: string; name: string; status: CheckStatus; detail: string };

const GROUPS = {
  scope: "1. Phân lập dữ liệu theo phòng ban",
  codes: "2. Mã định danh",
  archive: "3. Lưu kho, tem và bảng kiểm",
  orientation: "4. Giáo dục định hướng & xuất cảnh",
  sandbox: "5. Kiểm nghiệm luồng bằng dữ liệu thử",
} as const;

const STRANGER = "00000000-0000-4000-8000-00000000abcd";
const MARKET_DEPTS = ["du_hoc_chau_au", "du_hoc_nhat_han", "tt_chau_au", "tt_nhat_ban", "tt_han_quoc", "tt_dai_loan"];

/** Chạy toàn bộ kiểm nghiệm. Dữ liệu thử được tạo rồi xóa ngay, không sửa hồ sơ thật. */
export const runSystemDiagnostics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPermission(context, "system.diagnostics");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const out: CheckResult[] = [];
    const add = (group: string, name: string, status: CheckStatus, detail: string) =>
      out.push({ group, name, status, detail });
    const safe = async (group: string, name: string, fn: () => Promise<void>) => {
      try { await fn(); } catch (e) { add(group, name, "fail", e instanceof Error ? e.message : "Lỗi không xác định"); }
    };

    // ---------- 1. Phân lập ----------
    const { data: depts } = await db.from("catalog_departments").select("id, code");
    const deptByCode = new Map((depts ?? []).map((d) => [d.code, d.id]));
    await safe(GROUPS.scope, "Đủ phòng ban thị trường", async () => {
      const missing = MARKET_DEPTS.filter((c) => !deptByCode.has(c));
      add(GROUPS.scope, "Đủ phòng ban thị trường", missing.length ? "fail" : "pass",
        missing.length ? `Thiếu: ${missing.join(", ")}` : `${depts?.length ?? 0} phòng ban, đủ 6 phòng thị trường`);
    });
    const anyDept = deptByCode.get("tt_nhat_ban");
    if (anyDept) {
      await safe(GROUPS.scope, "Người ngoài phòng không xem được hồ sơ", async () => {
        const { data, error } = await db.rpc("can_access_student_department", {
          _user_id: STRANGER, _department_id: anyDept, _student_user_id: null as unknown as string, _write: false,
        });
        if (error) throw new Error(error.message);
        add(GROUPS.scope, "Người ngoài phòng không xem được hồ sơ", data ? "fail" : "pass",
          data ? "Tài khoản không phân công vẫn đọc được hồ sơ" : "Bị từ chối đúng quy định");
      });
      await safe(GROUPS.scope, "Ban Giám đốc xem toàn bộ", async () => {
        const { data, error } = await db.rpc("can_access_student_department", {
          _user_id: context.userId, _department_id: anyDept, _student_user_id: null as unknown as string, _write: true,
        });
        if (error) throw new Error(error.message);
        add(GROUPS.scope, "Ban Giám đốc xem toàn bộ", data ? "pass" : "fail",
          data ? "Tài khoản quản trị có quyền xem/ghi mọi phòng" : "Tài khoản quản trị bị chặn sai");
      });
    }
    await safe(GROUPS.scope, "Hồ sơ chưa phân công phòng ban", async () => {
      const { count } = await db.from("student_profiles").select("id", { count: "exact", head: true })
        .is("department_id", null).is("deleted_at", null);
      add(GROUPS.scope, "Hồ sơ chưa phân công phòng ban", count ? "warn" : "pass",
        count ? `${count} hồ sơ chỉ Ban Giám đốc xem được — cần phân công tại trang chi tiết học viên` : "Mọi hồ sơ đã có phòng ban");
    });

    // ---------- 2. Mã định danh ----------
    const dupCheck = (vals: string[]) => vals.length - new Set(vals).size;
    await safe(GROUPS.codes, "Mã học viên", async () => {
      const { data } = await db.from("student_profiles").select("student_code").is("deleted_at", null);
      const codes = (data ?? []).map((r) => r.student_code).filter(Boolean) as string[];
      const missing = (data?.length ?? 0) - codes.length;
      const dup = dupCheck(codes);
      add(GROUPS.codes, "Mã học viên", missing || dup ? "fail" : "pass",
        `${codes.length} mã, thiếu ${missing}, trùng ${dup}`);
    });
    await safe(GROUPS.codes, "Mã nhân sự KZ-NV", async () => {
      const { data } = await db.from("staff_profiles").select("staff_code");
      const codes = (data ?? []).map((r) => r.staff_code).filter(Boolean) as string[];
      const bad = codes.filter((c) => !/^KZ-NV-\d{4}-\d{4,}$/.test(c));
      add(GROUPS.codes, "Mã nhân sự KZ-NV", bad.length || dupCheck(codes) ? "fail" : "pass",
        `${data?.length ?? 0} hồ sơ nhân sự, sai định dạng ${bad.length}, trùng ${dupCheck(codes)}`);
    });
    await safe(GROUPS.codes, "Mã cộng tác viên KZ-CTV", async () => {
      const { data } = await db.from("sales_agents").select("collaborator_code");
      const codes = (data ?? []).map((r) => r.collaborator_code).filter(Boolean) as string[];
      const bad = codes.filter((c) => !/^KZ-CTV-\d{4}-\d{4,}$/.test(c));
      const missing = (data?.length ?? 0) - codes.length;
      add(GROUPS.codes, "Mã cộng tác viên KZ-CTV", bad.length || missing || dupCheck(codes) ? "fail" : "pass",
        `${codes.length} mã, thiếu ${missing}, sai định dạng ${bad.length}, trùng ${dupCheck(codes)}`);
    });

    // ---------- 3. Lưu kho ----------
    await safe(GROUPS.archive, "Hồ sơ lưu kho có vị trí tủ", async () => {
      const { data } = await db.from("student_archive_records").select("id, location_id, student_profile_id");
      const noLoc = (data ?? []).filter((r) => !r.location_id).length;
      add(GROUPS.archive, "Hồ sơ lưu kho có vị trí tủ", noLoc ? "warn" : "pass",
        `${data?.length ?? 0} phiếu lưu kho, ${noLoc} phiếu chưa gán vị trí`);
      const ids = [...new Set((data ?? []).map((r) => r.student_profile_id))];
      if (ids.length) {
        const { data: ck } = await db.from("student_document_checklist").select("student_profile_id").in("student_profile_id", ids);
        const has = new Set((ck ?? []).map((r) => r.student_profile_id));
        const lack = ids.filter((i) => !has.has(i)).length;
        add(GROUPS.archive, "Hồ sơ lưu kho có bảng kiểm để in", lack ? "warn" : "pass",
          `${ids.length - lack}/${ids.length} hồ sơ có bảng kiểm giấy tờ`);
      } else {
        add(GROUPS.archive, "Hồ sơ lưu kho có bảng kiểm để in", "warn", "Chưa có phiếu lưu kho nào để in tem");
      }
    });

    // ---------- 4. GDĐH ----------
    await safe(GROUPS.orientation, "Chương trình Giáo dục định hướng", async () => {
      const { count } = await db.from("training_programs").select("id", { count: "exact", head: true }).eq("program_type", "orientation");
      add(GROUPS.orientation, "Chương trình Giáo dục định hướng", count ? "pass" : "warn",
        count ? `${count} chương trình đang dùng` : "Chưa khai báo chương trình GDĐH — tạo tại Đào tạo › Chương trình, loại “Định hướng”");
    });
    await safe(GROUPS.orientation, "Học viên dự kiến xuất cảnh có chứng chỉ GDĐH", async () => {
      const { data: deps } = await db.from("departure_records").select("student_profile_id").eq("status", "planned");
      const ids = [...new Set((deps ?? []).map((d) => d.student_profile_id).filter(Boolean))] as string[];
      if (!ids.length) { add(GROUPS.orientation, "Học viên dự kiến xuất cảnh có chứng chỉ GDĐH", "pass", "Không có học viên dự kiến xuất cảnh liên kết hồ sơ"); return; }
      const { data: certs } = await db.from("certificates").select("student_profile_id, training_programs!inner(program_type)")
        .in("student_profile_id", ids).eq("status", "issued").eq("training_programs.program_type", "orientation");
      const ok = new Set((certs ?? []).map((c) => c.student_profile_id));
      const lack = ids.filter((i) => !ok.has(i)).length;
      add(GROUPS.orientation, "Học viên dự kiến xuất cảnh có chứng chỉ GDĐH", lack ? "warn" : "pass",
        lack ? `${lack}/${ids.length} học viên chưa có chứng chỉ — đang cảnh báo, chưa chặn` : `${ids.length} học viên đủ chứng chỉ`);
    });

    // ---------- 5. Sandbox ----------
    const stamp = Date.now().toString().slice(-8);
    const created: { students: string[]; program?: string; cert?: { id: string; market: string; year: number } } = { students: [] };
    try {
      const cases = [
        { country: "nhat-ban", program_type: "xkld", expect: "tt_nhat_ban", label: "XKLĐ Nhật Bản" },
        { country: "duc", program_type: "du_hoc", expect: "du_hoc_chau_au", label: "Du học Đức" },
      ];
      for (const c of cases) {
        const name = `Tự gán phòng: ${c.label}`;
        await safe(GROUPS.sandbox, name, async () => {
          const { data, error } = await db.from("student_profiles").insert({
            full_name: `KIỂM NGHIỆM TỰ ĐỘNG ${stamp}`, phone: `0900${stamp.slice(-6)}`,
            country: c.country, program_type: c.program_type, program: `Kiểm nghiệm ${c.label}`, current_status: "lead_new",
          } as never).select("id, student_code, department_id").single();
          if (error || !data) throw new Error(error?.message ?? "Không tạo được hồ sơ thử");
          created.students.push(data.id);
          const okDept = data.department_id === deptByCode.get(c.expect);
          add(GROUPS.sandbox, name, okDept && data.student_code ? "pass" : "fail",
            `Mã ${data.student_code ?? "chưa cấp"}; phòng ${okDept ? "đúng" : "sai"} (${c.expect})`);
          const { data: allowed } = await db.rpc("can_access_student_record", { _user_id: STRANGER, _student_id: data.id, _write: false });
          add(GROUPS.sandbox, `Chặn xem chéo: ${c.label}`, allowed ? "fail" : "pass",
            allowed ? "Người ngoài vẫn đọc được" : "Người ngoài bị chặn");
        });
      }
      const sid = created.students[0];
      if (sid) {
        await safe(GROUPS.sandbox, "Bảng kiểm tự tạo khi nhập hồ sơ", async () => {
          await db.rpc("sync_student_checklist", { _student_profile_id: sid });
          const { count } = await db.from("student_document_checklist").select("id", { count: "exact", head: true }).eq("student_profile_id", sid);
          add(GROUPS.sandbox, "Bảng kiểm tự tạo khi nhập hồ sơ", count ? "pass" : "warn", `${count ?? 0} mục giấy tờ`);
        });
        await safe(GROUPS.sandbox, "Cấp số chứng chỉ KZ-GDĐH", async () => {
          const { data: prog, error: pe } = await db.from("training_programs").insert({
            code: `KN-GDDH-${stamp}`, name: "Kiểm nghiệm GDĐH", program_type: "orientation", market: "nhat-ban", is_active: false,
          }).select("id").single();
          if (pe || !prog) throw new Error(pe?.message ?? "Không tạo được chương trình thử");
          created.program = prog.id;
          const { data: cert, error: ce } = await db.from("certificates").insert({
            certificate_number: `TMP-${stamp}`, verify_code: `KN${stamp}`, student_profile_id: sid,
            program_id: prog.id, title: "Kiểm nghiệm", recipient_name: "Kiểm nghiệm",
          }).select("id, certificate_number, issued_at").single();
          if (ce || !cert) throw new Error(ce?.message ?? "Không tạo được chứng chỉ thử");
          created.cert = { id: cert.id, market: "JP", year: new Date(cert.issued_at).getFullYear() };
          const ok = /^KZ-GDĐH-JP-\d{4}-\d{5}$/.test(cert.certificate_number);
          add(GROUPS.sandbox, "Cấp số chứng chỉ KZ-GDĐH", ok ? "pass" : "fail", `Số sinh ra: ${cert.certificate_number}`);
        });
      }
    } finally {
      // Dọn sạch dữ liệu thử, trả lại bộ đếm số chứng chỉ.
      if (created.cert) {
        await db.from("certificates").delete().eq("id", created.cert.id);
        const { data: ctr } = await db.from("orientation_certificate_counters").select("last_no")
          .eq("market_code", created.cert.market).eq("year", created.cert.year).maybeSingle();
        if (ctr) await db.from("orientation_certificate_counters").update({ last_no: Math.max(0, ctr.last_no - 1) })
          .eq("market_code", created.cert.market).eq("year", created.cert.year);
      }
      if (created.program) await db.from("training_programs").delete().eq("id", created.program);
      if (created.students.length) {
        await db.from("notifications").delete().or(`title.ilike.%${stamp}%,body.ilike.%${stamp}%`);
        const { error } = await db.from("student_profiles").delete().in("id", created.students);
        add(GROUPS.sandbox, "Dọn dữ liệu thử", error ? "fail" : "pass",
          error ? `Chưa xóa được: ${error.message}` : `Đã xóa ${created.students.length} hồ sơ thử`);
      }
    }

    const summary = {
      pass: out.filter((r) => r.status === "pass").length,
      warn: out.filter((r) => r.status === "warn").length,
      fail: out.filter((r) => r.status === "fail").length,
    };
    return { ranAt: new Date().toISOString(), runBy: context.userId, summary, results: out };
  });
