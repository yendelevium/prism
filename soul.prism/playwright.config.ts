import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

// Read from default .env.e2e file.
dotenv.config({ path: path.resolve(__dirname, ".env.e2e") });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e/specs",
  // E2E tests target real browser behavior.
  testMatch: "**/*.spec.ts",
  globalSetup: "./tests/e2e/global-setup.ts",
  
  // Maximum time one test can run for.
  timeout: 45 * 1000,
  
  // Run tests in files sequentially (shared DB isolation)
  workers: 1,

  // Prevents the test failure if Next.js hasn't fully hydrated yet
  expect: {
    timeout: 10 * 1000,
  },

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only to handle network flakiness
  retries: process.env.CI ? 2 : 0,

  // Reporter to use
  reporter: [["list"], ["html"]],

  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

    // Collect trace when retrying the failed test.
    trace: "on-first-retry",
    
    // Auto-capture screenshot on failure
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // 1440x900 as specified
        viewport: { width: 1440, height: 900 },
      },
    },
    // Can add Firefox, WebKit later
  ],

  /* Run Next.js local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start dev server
    // We pass our E2E env vars to the dev server so the API seed route is active
    env: {
      ...process.env,
      ENABLE_TEST_ROUTES: "true",
      NEXT_PUBLIC_ENABLE_MSW: "true",
    },
  },
});
