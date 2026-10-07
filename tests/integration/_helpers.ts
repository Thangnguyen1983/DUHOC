import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const TEST_PREFIX = "__vitest_";

export function makeAdmin(): SupabaseClient<any, any, any> {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type SeedResult = {
  teacher: { id: string; email: string };
  otherTeacher: { id: string; email: string };
  student: { id: string; email: string; profileId: string };
  outsiderStudent: { id: string; email: string; profileId: string };
  program: { id: string; code: string };
  cls: { id: string; code: string };
  otherCls: { id: string; code: string };
  session: { id: string };
  enrollment: { id: string };
};

async function ensureRole(admin: SupabaseClient, user_id: string, role: string) {
  await admin.from("user_roles").upsert({ user_id, role }, { onConflict: "user_id,role" });
}

async function createUser(admin: SupabaseClient, role: string): Promise<{ id: string; email: string }> {
  const email = `${TEST_PREFIX}${role}-${randomUUID().slice(0, 8)}@kaizen-test.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: `Test!${randomUUID().slice(0, 10)}A1`,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  await ensureRole(admin, data.user.id, role);
  return { id: data.user.id, email };
}

export async function seed(admin: SupabaseClient): Promise<SeedResult> {
  const teacher = await createUser(admin, "teacher");
  const otherTeacher = await createUser(admin, "teacher");
  const studentAuth = await createUser(admin, "student");
  const outsiderAuth = await createUser(admin, "student");

  const tag = randomUUID().slice(0, 8);

  const { data: program, error: pErr } = await admin
    .from("training_programs")
    .insert({
      code: `${TEST_PREFIX}prg_${tag}`,
      name: `${TEST_PREFIX}Program ${tag}`,
      language: "de",
      level: "B1",
    })
    .select("id, code")
    .single();
  if (pErr) throw new Error(`seed program: ${pErr.message}`);

  const { data: cls, error: cErr } = await admin
    .from("training_classes")
    .insert({
      program_id: program.id,
      code: `${TEST_PREFIX}cls_${tag}_A`,
      name: `${TEST_PREFIX}Class A ${tag}`,
      teacher_id: teacher.id,
      status: "active",
      schedule: "T2-4-6",
      room: "P101",
    })
    .select("id, code")
    .single();
  if (cErr) throw new Error(`seed class: ${cErr.message}`);

  const { data: otherCls, error: c2Err } = await admin
    .from("training_classes")
    .insert({
      program_id: program.id,
      code: `${TEST_PREFIX}cls_${tag}_B`,
      name: `${TEST_PREFIX}Class B ${tag}`,
      teacher_id: otherTeacher.id,
      status: "active",
    })
    .select("id, code")
    .single();
  if (c2Err) throw new Error(`seed otherCls: ${c2Err.message}`);

  const { data: session, error: sErr } = await admin
    .from("training_sessions")
    .insert({
      class_id: cls.id,
      session_no: 1,
      title: "Buổi 1",
      session_date: new Date().toISOString().slice(0, 10),
      status: "scheduled",
    })
    .select("id")
    .single();
  if (sErr) throw new Error(`seed session: ${sErr.message}`);

  // Student profile linked to auth user via email
  const { data: sp, error: spErr } = await admin
    .from("student_profiles")
    .insert({
      user_id: studentAuth.id,
      full_name: `${TEST_PREFIX}Student ${tag}`,
      email: studentAuth.email,
      current_status: "lead_contacted",
    })
    .select("id")
    .single();
  if (spErr) throw new Error(`seed student profile: ${spErr.message}`);

  const { data: outsiderSp, error: outErr } = await admin
    .from("student_profiles")
    .insert({
      user_id: outsiderAuth.id,
      full_name: `${TEST_PREFIX}Outsider ${tag}`,
      email: outsiderAuth.email,
      current_status: "lead_contacted",
    })
    .select("id")
    .single();
  if (outErr) throw new Error(`seed outsider profile: ${outErr.message}`);

  const { data: enr, error: eErr } = await admin
    .from("training_enrollments")
    .insert({
      class_id: cls.id,
      student_profile_id: sp.id,
      status: "active",
    })
    .select("id")
    .single();
  if (eErr) throw new Error(`seed enrollment: ${eErr.message}`);

  return {
    teacher,
    otherTeacher,
    student: { id: studentAuth.id, email: studentAuth.email, profileId: sp.id },
    outsiderStudent: {
      id: outsiderAuth.id,
      email: outsiderAuth.email,
      profileId: outsiderSp.id,
    },
    program: { id: program.id, code: program.code },
    cls: { id: cls.id, code: cls.code },
    otherCls: { id: otherCls.id, code: otherCls.code },
    session: { id: session.id },
    enrollment: { id: enr.id },
  };
}

export async function cleanup(admin: SupabaseClient, seed?: SeedResult) {
  // Cascade chains handle attendance/grades/sessions/enrollments via FK ON DELETE CASCADE.
  // We only need to delete classes + program + profiles + users (and any straggler rows).
  if (seed) {
    await admin.from("training_classes").delete().in("id", [seed.cls.id, seed.otherCls.id]);
    await admin.from("training_programs").delete().eq("id", seed.program.id);
    await admin
      .from("student_profiles")
      .delete()
      .in("id", [seed.student.profileId, seed.outsiderStudent.profileId]);
    for (const uid of [
      seed.teacher.id,
      seed.otherTeacher.id,
      seed.student.id,
      seed.outsiderStudent.id,
    ]) {
      await admin.from("user_roles").delete().eq("user_id", uid);
      try {
        await admin.auth.admin.deleteUser(uid);
      } catch {
        /* ignore */
      }
    }
  }
  // Safety net: scrub any leftover rows with the test prefix.
  await admin.from("training_classes").delete().like("code", `${TEST_PREFIX}%`);
  await admin.from("training_programs").delete().like("code", `${TEST_PREFIX}%`);
  await admin.from("student_profiles").delete().like("full_name", `${TEST_PREFIX}%`);
}
