import { test, expect } from "./_fixtures";

/**
 * Verifies that a published CMS `blog` entry appears on the homepage,
 * on /tin-tuc list, on the correct market tab, and on its detail page.
 * Cleans up after itself so it can run repeatedly.
 */
test.describe("CMS publish → public channels", () => {
  const unique = Date.now();
  const slug = `e2e-post-${unique}`;
  const title = `E2E Bài viết ${unique}`;
  const excerpt = `Tóm tắt kiểm thử ${unique}`;
  const marketSlug = "duc";

  let entryId: string | null = null;

  test.afterEach(async ({ admin }) => {
    if (entryId) {
      await admin.from("cms_entry_tags").delete().eq("entry_id", entryId);
      await admin.from("cms_entries").delete().eq("id", entryId);
      entryId = null;
    }
  });

  test("published post shows on home, /tin-tuc, market tab and detail", async ({ page, admin }) => {
    // 1. Lookup blog content type + market tag
    const { data: type } = await admin
      .from("cms_content_types")
      .select("id")
      .eq("slug", "blog")
      .maybeSingle();
    expect(type?.id, "Content type 'blog' must exist").toBeTruthy();

    const { data: tag } = await admin
      .from("cms_tags")
      .select("id,name")
      .eq("slug", marketSlug)
      .maybeSingle();
    expect(tag?.id, `Tag '${marketSlug}' must exist`).toBeTruthy();

    // 2. Insert a published entry via admin (bypasses UI)
    const { data: inserted, error: insErr } = await admin
      .from("cms_entries")
      .insert({
        content_type_id: type!.id,
        slug,
        title,
        excerpt,
        status: "published",
        published_at: new Date().toISOString(),
        data: { body: "<p>Nội dung kiểm thử E2E</p>" },
      })
      .select("id")
      .single();
    expect(insErr, insErr?.message).toBeFalsy();
    entryId = inserted!.id;

    await admin.from("cms_entry_tags").insert({ entry_id: entryId, tag_id: tag!.id });

    // 3. Homepage: latest 3 posts should include our new one
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Tin tức & Sự kiện/i })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(title, "i") })).toBeVisible({ timeout: 10_000 });

    // 4. /tin-tuc list
    await page.goto("/tin-tuc");
    await expect(page.getByRole("link", { name: new RegExp(title, "i") })).toBeVisible({ timeout: 10_000 });

    // 5. Market filter tab (Đức)
    await page.goto(`/tin-tuc?market=${marketSlug}`);
    await expect(page.getByRole("link", { name: new RegExp(title, "i") })).toBeVisible({ timeout: 10_000 });

    // 6. Detail page
    await page.goto(`/tin-tuc/${slug}`);
    await expect(page.getByRole("heading", { name: new RegExp(title, "i") })).toBeVisible();
    await expect(page.getByText(/Nội dung kiểm thử E2E/)).toBeVisible();
  });

  test("unpublished draft does NOT appear on public channels", async ({ page, admin }) => {
    const { data: type } = await admin
      .from("cms_content_types")
      .select("id")
      .eq("slug", "blog")
      .maybeSingle();
    expect(type?.id).toBeTruthy();

    const draftSlug = `e2e-draft-${unique}`;
    const draftTitle = `E2E DRAFT ${unique}`;
    const { data: inserted } = await admin
      .from("cms_entries")
      .insert({
        content_type_id: type!.id,
        slug: draftSlug,
        title: draftTitle,
        excerpt: "Draft không được hiện",
        status: "draft",
        data: { body: "<p>draft</p>" },
      })
      .select("id")
      .single();
    entryId = inserted!.id;

    await page.goto("/");
    await expect(page.getByRole("link", { name: new RegExp(draftTitle, "i") })).toHaveCount(0);
    await page.goto("/tin-tuc");
    await expect(page.getByRole("link", { name: new RegExp(draftTitle, "i") })).toHaveCount(0);
  });
});
