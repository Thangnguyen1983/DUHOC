import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  getMyClassDetailImpl,
  getMyClassesImpl,
  markAttendanceImpl,
  upsertGradeImpl,
  type PortalCtx,
} from "@/lib/portal/portal.impl";
import { cleanup, makeAdmin, seed, type SeedResult } from "./_helpers";

const admin = makeAdmin();
let data: SeedResult;

function ctxFor(
  user: { id: string; email: string },
  roles: string[],
): PortalCtx {
  return { admin, userId: user.id, email: user.email, roles };
}

beforeAll(async () => {
  data = await seed(admin);
});

afterAll(async () => {
  await cleanup(admin, data);
});

describe("getMyClasses", () => {
  it("teacher sees only classes they teach", async () => {
    const out = await getMyClassesImpl(ctxFor(data.teacher, ["teacher"]));
    expect(out.isTeacher).toBe(true);
    const ids = out.classes.map((c: any) => c.id);
    expect(ids).toContain(data.cls.id);
    expect(ids).not.toContain(data.otherCls.id);
  });

  it("student sees enrolled classes with enrollment metadata", async () => {
    const out = await getMyClassesImpl(ctxFor(data.student, ["student"]));
    expect(out.isStudent).toBe(true);
    expect(out.classes).toHaveLength(1);
    expect(out.classes[0].id).toBe(data.cls.id);
    expect(out.classes[0].enrollment_id).toBe(data.enrollment.id);
  });

  it("unrelated student gets empty list", async () => {
    const out = await getMyClassesImpl(ctxFor(data.outsiderStudent, ["student"]));
    expect(out.classes).toHaveLength(0);
  });
});

describe("getMyClassDetail", () => {
  it("enrolled student can read the class", async () => {
    const out = await getMyClassDetailImpl(ctxFor(data.student, ["student"]), {
      class_id: data.cls.id,
    });
    expect((out.cls as any).id).toBe(data.cls.id);
    expect(out.sessions.length).toBeGreaterThan(0);
  });

  it("non-enrolled student is rejected", async () => {
    await expect(
      getMyClassDetailImpl(ctxFor(data.outsiderStudent, ["student"]), {
        class_id: data.cls.id,
      }),
    ).rejects.toThrow(/không có trong lớp/i);
  });

  it("teacher who does not own the class is rejected", async () => {
    await expect(
      getMyClassDetailImpl(ctxFor(data.otherTeacher, ["teacher"]), {
        class_id: data.cls.id,
      }),
    ).rejects.toThrow(/không phụ trách/i);
  });
});

describe("markAttendanceImpl", () => {
  it("teacher upserts attendance idempotently", async () => {
    const ctx = ctxFor(data.teacher, ["teacher"]);
    const first = await markAttendanceImpl(ctx, {
      session_id: data.session.id,
      items: [{ enrollment_id: data.enrollment.id, status: "late", note: "Đi muộn 5p" }],
    });
    expect(first.count).toBe(1);

    await markAttendanceImpl(ctx, {
      session_id: data.session.id,
      items: [{ enrollment_id: data.enrollment.id, status: "present", note: null }],
    });

    const { data: rows } = await admin
      .from("training_attendance")
      .select("status")
      .eq("session_id", data.session.id)
      .eq("enrollment_id", data.enrollment.id);
    expect(rows).toHaveLength(1);
    expect(rows![0].status).toBe("present");
  });

  it("rejects teacher who does not own the class", async () => {
    await expect(
      markAttendanceImpl(ctxFor(data.otherTeacher, ["teacher"]), {
        session_id: data.session.id,
        items: [{ enrollment_id: data.enrollment.id, status: "absent" }],
      }),
    ).rejects.toThrow(/không phụ trách/i);
  });

  it("rejects non-teacher", async () => {
    await expect(
      markAttendanceImpl(ctxFor(data.student, ["student"]), {
        session_id: data.session.id,
        items: [{ enrollment_id: data.enrollment.id, status: "present" }],
      }),
    ).rejects.toThrow(/forbidden/i);
  });
});

describe("upsertGradeImpl", () => {
  it("teacher inserts then updates the same grade row", async () => {
    const ctx = ctxFor(data.teacher, ["teacher"]);
    const created = await upsertGradeImpl(ctx, {
      enrollment_id: data.enrollment.id,
      grade_type: "midterm",
      title: "Giữa kỳ",
      score: 7.5,
      max_score: 10,
      weight: 1,
    });
    expect(created.id).toBeTruthy();

    const updated = await upsertGradeImpl(ctx, {
      id: created.id,
      enrollment_id: data.enrollment.id,
      grade_type: "midterm",
      title: "Giữa kỳ",
      score: 8.5,
      max_score: 10,
      weight: 1,
    });
    expect(updated.id).toBe(created.id);

    const { data: rows } = await admin
      .from("training_grades")
      .select("score")
      .eq("id", created.id);
    expect(Number(rows![0].score)).toBe(8.5);
  });

  it("rejects student", async () => {
    await expect(
      upsertGradeImpl(ctxFor(data.student, ["student"]), {
        enrollment_id: data.enrollment.id,
        grade_type: "quiz",
        score: 9,
        max_score: 10,
        weight: 1,
      }),
    ).rejects.toThrow(/forbidden/i);
  });

  it("rejects teacher who does not own the class", async () => {
    await expect(
      upsertGradeImpl(ctxFor(data.otherTeacher, ["teacher"]), {
        enrollment_id: data.enrollment.id,
        grade_type: "quiz",
        score: 5,
        max_score: 10,
        weight: 1,
      }),
    ).rejects.toThrow(/không phụ trách/i);
  });
});

describe("student detail view after teacher actions", () => {
  it("student now sees their attendance + grade entries", async () => {
    const detail = await getMyClassDetailImpl(ctxFor(data.student, ["student"]), {
      class_id: data.cls.id,
    });
    expect(detail.myAttendance.length).toBeGreaterThan(0);
    expect(detail.myGrades.length).toBeGreaterThan(0);
  });
});
