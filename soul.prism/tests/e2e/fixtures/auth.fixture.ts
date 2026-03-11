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
      // 1. Navigate to any page first to establish origin
      await page.goto("/");
      
      // 2. Inject Clerk testing token AFTER page load
      await setupClerkTestingToken({ page });
      
      // 3. Navigate again so the token cookie is active
      await page.goto("/");
      
      // 4. Now fetch whoami inside the browser context window using page.goto
      const resp = await page.goto("/api/test/whoami");
      if (!resp || !resp.ok()) {
        const bodyText = await resp?.text();
        throw new Error(
          `whoami failed: ${resp?.status()} ${bodyText}`
        );
      }
      const { userId: clerkUserId } = await resp.json();
      
      // 5. Seed DB with real Clerk userId
      const accountInfo = await seedWorkspace(clerkUserId, role);
      
      return {
        workspaceId: accountInfo.workspaceId,
        userId: clerkUserId,
      };
    });
  },
});

export { expect };
