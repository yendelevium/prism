import { test as baseTest, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { resetDatabase, seedWorkspace } from "./seed-api";

type AuthFixture = {
  /**
   * Automates the background programmatic Clerk authentication process,
   * completely skipping the UI, and prepares a database profile for the test.
   *
   * @param role The role to grant in the newly created Workspace
   */
  authenticateAs: (role?: "admin" | "editor" | "viewer") => Promise<{
    workspaceId: string;
    userId: string;
  }>;
};

export const test = baseTest.extend<AuthFixture>({
  authenticateAs: async ({ page }, use) => {
    // 1. Wipe the test DB unconditionally once per test to ensure isolation
    await resetDatabase();

    await use(async (role = "admin") => {
      // 1. Navigate to Sign In page
      await page.goto("/sign-in");
      await page.waitForLoadState("networkidle");
      
      // 2. Perform Real UI Login — mirrors the exact pattern from auth.spec.ts which passes
      const emailInput = page.getByLabel("Email address");
      await emailInput.waitFor({ state: "visible", timeout: 15000 });
      await emailInput.fill(process.env.E2E_TEST_EMAIL || "prism-e2e-test@gmail.com");
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      
      // Use the NAME attribute selector — this is what Clerk actually renders
      const passwordInput = page.locator('input[name="password"]');
      await passwordInput.waitFor({ state: "visible", timeout: 15000 });
      await passwordInput.fill(process.env.E2E_TEST_PASSWORD || "PrismTest123!");
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      
      // 3. Wait until Clerk physically redirects to the dashboard
      await page.waitForURL(/.*dashboard.*/, { timeout: 30000 });
      await page.waitForLoadState("networkidle");
      
      // 4. Retrieve the real Clerk user ID via whoami
      const result = await page.evaluate(async () => {
        const resp = await fetch("/api/test/whoami", { credentials: "include" });
        if (!resp.ok) throw new Error(`whoami failed: ${resp.status}`);
        return await resp.json();
      });
      
      const clerkUserId = result.userId;
      
      // 5. Seed DB matching this actual Clerk user
      const accountInfo = await seedWorkspace(clerkUserId, role);
      
      // 6. Final sync navigation to dashboard/requests
      await page.goto("/dashboard/requests");
      await page.waitForLoadState("networkidle");

      return {
        workspaceId: accountInfo.workspaceId,
        userId: clerkUserId,
      };
    });
  },
});

export { expect };
