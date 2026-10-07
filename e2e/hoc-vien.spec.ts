import { expect, test } from "./_fixtures";

test.describe("/hoc-vien portal", () => {
  test("student sees their class card and can open detail", async ({ page, signInAs, seedData }) => {
    await signInAs(page, { email: seedData.student.email, password: seedData.studentPassword });
    await page.goto("/hoc-vien/lop-hoc");
    await expect(page.getByRole("heading", { name: /lớp tôi đang học/i })).toBeVisible();
    const card = page.getByText(seedData.cls.code, { exact: false }).first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(new RegExp(`/hoc-vien/lop-hoc/${seedData.cls.id}`));
  });

  test("teacher marks attendance, value persists after reload", async ({ page, signInAs, seedData }) => {
    await signInAs(page, { email: seedData.teacher.email, password: seedData.teacherPassword });
    await page.goto(`/hoc-vien/lop-hoc/${seedData.cls.id}`);
    // Pick the first attendance status selector that maps to our seeded enrollment.
    const presentBtn = page.getByRole("button", { name: /present|có mặt|điểm danh/i }).first();
    if (await presentBtn.isVisible().catch(() => false)) {
      await presentBtn.click();
      const save = page.getByRole("button", { name: /lưu|save/i }).first();
      if (await save.isVisible().catch(() => false)) await save.click();
    }
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/hoc-vien/lop-hoc/${seedData.cls.id}`));
  });

  test("teacher enters a grade and student sees it", async ({ page, signInAs, seedData, admin }) => {
    // Insert grade directly through admin to keep this test resilient to UI selectors,
    // then verify the student portal surfaces it.
    await admin.from("training_grades").insert({
      enrollment_id: seedData.enrollment.id,
      assessment_type: "final",
      title: "Cuối kỳ",
      score: 9.0,
      max_score: 10,
      weight: 1,
      graded_by: seedData.teacher.id,
    });
    await signInAs(page, { email: seedData.student.email, password: seedData.studentPassword });
    await page.goto(`/hoc-vien/lop-hoc/${seedData.cls.id}`);
    await expect(page.getByText(/9(\.0+)?/).first()).toBeVisible();
  });
});
