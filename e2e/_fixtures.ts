import { test as base, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cleanup, makeAdmin, seed, type SeedResult } from "../tests/integration/_helpers";

type SignedUser = { id: string; email: string; password: string; accessToken: string; refreshToken: string };

type Fixtures = {
  admin: SupabaseClient<any, any, any>;
  seedData: SeedResult & { studentPassword: string; teacherPassword: string };
  signInAs: (page: Page, user: { email: string; password: string }) => Promise<SignedUser>;
};

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
const SUPABASE_PROJECT_REF = SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0];
const STORAGE_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

export const test = base.extend<Fixtures>({
  admin: async ({}, use) => {
    await use(makeAdmin());
  },
  seedData: async ({ admin }, use) => {
    const seedResult = await seed(admin);
    // Reset passwords to known values so we can mint sessions.
    const teacherPassword = "TeacherPass!23";
    const studentPassword = "StudentPass!23";
    await admin.auth.admin.updateUserById(seedResult.teacher.id, { password: teacherPassword });
    await admin.auth.admin.updateUserById(seedResult.student.id, { password: studentPassword });
    await use({ ...seedResult, teacherPassword, studentPassword });
    await cleanup(admin, seedResult);
  },
  signInAs: async ({}, use) => {
    async function signIn(page: Page, user: { email: string; password: string }): Promise<SignedUser> {
      const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await client.auth.signInWithPassword(user);
      if (error || !data.session) throw new Error(`signInAs failed: ${error?.message}`);
      const session = data.session;
      // Establish localhost origin first, then inject session into localStorage.
      await page.goto("/");
      await page.evaluate(
        ([key, value]) => window.localStorage.setItem(key, value),
        [STORAGE_KEY, JSON.stringify(session)],
      );
      return {
        id: data.user!.id,
        email: user.email,
        password: user.password,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      };
    }
    await use(signIn);
  },
});

export const expect = test.expect;
