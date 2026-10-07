import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    exclude: ["node_modules", "dist", "e2e/**"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    pool: "forks",
    setupFiles: ["tests/integration/_setup.ts"],
  },
  // Serialize across files: tests share sandbox rows.
  poolOptions: { forks: { singleFork: true } },
});
