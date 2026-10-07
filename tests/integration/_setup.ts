import "dotenv/config";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Integration tests require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env",
  );
}
