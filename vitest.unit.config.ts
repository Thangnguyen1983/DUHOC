import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests: pure functions, no external services (no Supabase env required).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["node_modules", "dist", "e2e/**", "tests/integration/**"],
    testTimeout: 10_000,
  },
});
