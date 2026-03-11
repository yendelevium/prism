/**
 * Vitest configuration for integration tests.
 *
 * Runs against a real PostgreSQL Testcontainer — completely
 * separate from the unit-test config (vitest.config.ts).
 *
 * Usage:
 *   npx vitest run --config vitest.integration.config.ts
 */

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",

    /* ---- Lifecycle hooks ---- */
    // globalSetup starts / stops the Testcontainer once for the whole run
    globalSetup: ["./tests/integration/setup/db.ts"],

    // setupFiles run in every test file's context before the tests execute
    // We use it to truncate all tables before each test
    setupFiles: ["./tests/integration/setup/per-file-setup.ts"],

    /* ---- Test discovery ---- */
    include: ["tests/integration/**/*.test.ts"],
    exclude: ["**/node_modules/**"],

    /* ---- Isolation ---- */
    pool: "forks",              // each file gets its own forked process for DB safety
    fileParallelism: false,     // run test files sequentially — they share one DB

    /* ---- Timing ---- */
    testTimeout: 30_000,   // containers + migrations are slow
    hookTimeout: 60_000,   // globalSetup can take a while the first time

    /* ---- Misc ---- */
    globals: true,
  },
});
