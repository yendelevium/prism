import { test, expect } from "../fixtures/auth.fixture";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

test.describe("E2E: Epic 5 — Platform & DevOps", () => {

  test("US 5.3 — RBAC UI", async ({ page, authenticateAs }) => {
    // Viewer context
    const viewerContext = await authenticateAs("viewer");
    
    await page.goto("/dashboard/requests");
    await page.click('[data-testid="collection-list-item"]');
    
    // Viewer shouldn't see delete
    await expect(page.locator('[data-testid="delete-request-btn"]')).toBeHidden();
    await expect(page.locator('[data-testid="delete-collection-btn"]')).toBeHidden();

    // Direct malicious navigation
    await page.goto("/dashboard/requests?action=delete&id=xyz");
    await expect(page.locator('[data-testid="unauthorized-msg"]')).toBeVisible();

    // Editor context 
    const editorContext = await authenticateAs("editor");
    await page.goto("/dashboard/requests");
    await expect(page.locator('[data-testid="delete-collection-btn"]')).toBeHidden();

    // Admin context
    const adminContext = await authenticateAs("admin");
    await page.goto("/dashboard/requests");
    await expect(page.locator('[data-testid="delete-collection-btn"]')).toBeVisible();
  });

  test("US 5.5 — Workspace Switcher", async ({ page, authenticateAs }) => {
    const adminA = await authenticateAs("admin");
    await page.goto("/dashboard/requests");

    // Add unique collection to WS 1
    await page.click('[data-testid="create-collection-btn"]');
    await page.fill('[data-testid="collection-name-input"]', "Team A Coll");
    await page.click('[data-testid="save-collection-btn"]');
    await expect(page.locator('[data-testid="sidebar-collection-Team A Coll"]')).toBeVisible();

    // Programmatically clear out current user but spawn a second Workspace with their ID
    // Note: in a true integration this might involve switching clerk tokens. For our mock,
    // we instruct the UI switcher payload
    await page.click('[data-testid="workspace-switcher-trigger"]');
    await page.click('[data-testid="switch-ws-Team B"]'); // ASSUME mock API spun this up for the user

    // Assert the specific data is missing
    await expect(page.locator('[data-testid="sidebar-collection-Team A Coll"]')).toBeHidden();
    
    await page.goto("/dashboard/analytics");
    await expect(page.locator('[data-testid="analytics-ws-label"]')).toContainText("Team B");
  });

  test("US 5.6 — Privacy Redaction UI", async ({ page, authenticateAs }) => {
    await authenticateAs("admin");

    await page.goto("/dashboard/traces");
    // Assume a mock span includes a 'password' attribute
    await expect(page.locator('[data-testid="trace-waterfall-rendered"]')).toBeVisible();
    await page.click('[data-testid^="span-bar-"] >> nth=0');

    // Default view restricts plaintext
    const secretRow = page.locator('[data-testid="attr-row"]:has-text("password")');
    await expect(secretRow.locator('[data-testid="attr-value"]')).toContainText("[REDACTED]");

    // Admins can toggle
    await page.click('[data-testid="show-raw-toggle"]');
    await expect(secretRow.locator('[data-testid="attr-value"]')).not.toContainText("[REDACTED]");

    // Verify Viewer cannot see toggle
    await authenticateAs("viewer");
    await page.goto("/dashboard/traces");
    await expect(page.locator('[data-testid="trace-waterfall-rendered"]')).toBeVisible();
    await page.click('[data-testid^="span-bar-"] >> nth=0');
    await expect(page.locator('[data-testid="show-raw-toggle"]')).toBeHidden();
  });
});
