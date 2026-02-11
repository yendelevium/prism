// Backend-only test scope: run src/backend/**/*.test.ts only (skip frontend tests).
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
    include: ["src/backend/**/*.test.ts"],
    exclude: ["**/*.test.tsx", "src/components/**", "src/app/**"],
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
