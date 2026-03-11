import { test, expect } from "../fixtures/auth.fixture";

test.describe("E2E: Epic 1 — Core Request Engine", () => {
  let initialContext: { workspaceId: string; userId: string };

  test.beforeEach(async ({ authenticateAs }) => {
    initialContext = await authenticateAs("admin");
  });

  test("US 1.1 — Request Builder UI", async ({ page }) => {
    // Navigate straight to dashboard/requests with our programmatic token active
    await page.goto("/dashboard/requests");

    await page.click('[data-testid="new-request-btn"]');
    await expect(page.locator('[data-testid="request-builder-panel"]')).toBeVisible();

    await page.selectOption('[data-testid="method-select"]', "POST");
    await page.fill('[data-testid="url-input"]', "https://httpbin.org/post");

    // Add Headers
    await page.click('[data-testid="add-header-btn"]');
    await page.fill('[data-testid="header-key-input-0"]', "Content-Type");
    await page.fill('[data-testid="header-val-input-0"]', "application/json");

    // Add Body
    await page.click('[data-testid="tab-body"]');
    await page.fill('[data-testid="body-editor"]', '{"test": true}');

    // Send the Request
    await page.click('[data-testid="send-request-btn"]');

    // Asserts
    await expect(page.locator('[data-testid="response-status"]')).toContainText("200");
    await expect(page.locator('[data-testid="response-body"]')).toContainText("test");
    await expect(page.locator('[data-testid="execution-history-item"]')).toHaveCount(1);
  });

  test("US 1.4 — Environment Variables", async ({ page }) => {
    await page.goto("/dashboard/environments");
    await page.click('[data-testid="new-environment-btn"]');
    await page.fill('[data-testid="env-name-input"]', "Dev");
    await page.fill('[data-testid="env-key-0"]', "BASE_URL");
    await page.fill('[data-testid="env-val-0"]', "https://httpbin.org");
    await page.click('[data-testid="save-env-btn"]');

    await page.goto("/dashboard/requests");
    await page.click('[data-testid="new-request-btn"]');
    await page.selectOption('[data-testid="env-selector"]', { label: "Dev" });
    await page.fill('[data-testid="url-input"]', "{{BASE_URL}}/get");

    await page.click('[data-testid="send-request-btn"]');
    await expect(page.locator('[data-testid="response-status"]')).toContainText("200");
    await expect(page.locator('[data-testid="execution-history-item"]')).toContainText("https://httpbin.org/get");
  });

  test("US 1.6 — Response Formatting", async ({ page }) => {
    await page.goto("/dashboard/requests");
    await page.click('[data-testid="new-request-btn"]');
    await page.fill('[data-testid="url-input"]', "https://httpbin.org/json");
    await page.click('[data-testid="send-request-btn"]');

    await expect(page.locator('[data-testid="response-body"]')).toBeVisible();

    // Clipboard test
    await page.click('[data-testid="copy-to-clipboard-btn"]');
    await expect(page.locator('[data-testid="copy-to-clipboard-btn"]')).toContainText("Copied!");

    // Download test
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('[data-testid="save-to-file-btn"]'),
    ]);
    expect(download.suggestedFilename()).toBeDefined();
  });

  test("US 1.7 — Collections", async ({ page }) => {
    await page.goto("/dashboard/requests");

    // Create Collection
    await page.click('[data-testid="create-collection-btn"]');
    await page.fill('[data-testid="collection-name-input"]', "My API Tests");
    await page.click('[data-testid="save-collection-btn"]');
    await expect(page.locator('[data-testid="sidebar-collection-My API Tests"]')).toBeVisible();

    // Create 3 requests (mocked interaction)
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="new-request-btn"]');
      await page.selectOption('[data-testid="collection-select"]', { label: "My API Tests" });
      await page.fill('[data-testid="url-input"]', `https://httpbin.org/get?q=${i}`);
      await page.click('[data-testid="save-request-btn"]');
    }

    await expect(page.locator('[data-testid="collection-count-My API Tests"]')).toContainText("3");

    // Rename
    await page.click('[data-testid="edit-collection-btn"]');
    await page.fill('[data-testid="collection-name-input"]', "Renamed Tests");
    await page.click('[data-testid="save-collection-btn"]');
    await expect(page.locator('[data-testid="sidebar-collection-Renamed Tests"]')).toBeVisible();

    // Delete one
    await page.click('[data-testid="delete-request-btn"]');
    await expect(page.locator('[data-testid="collection-count-Renamed Tests"]')).toContainText("2");

    // Delete entire collection
    await page.click('[data-testid="delete-collection-btn"]');
    await expect(page.locator('[data-testid="sidebar-collection-Renamed Tests"]')).toBeHidden();
  });

  test("US 1.5 — Real-Time Log Streaming", async ({ page }) => {
    // Ensure we trigger real time websockets/SSE rendering 
    await page.goto("/dashboard/requests");
    await page.click('[data-testid="new-request-btn"]');
    // Using a deliberately slow mocked endpoint
    await page.fill('[data-testid="url-input"]', "https://httpbin.org/delay/2");
    
    // We expect log output rendering mid-flight
    await page.click('[data-testid="send-request-btn"]');
    
    await expect(page.locator('[data-testid="log-panel"]')).toContainText("Preparing request...");
    await expect(page.locator('[data-testid="log-panel"]')).toContainText("Connecting...");
    
    // Finalize
    await expect(page.locator('[data-testid="response-status"]')).toContainText("200");
    await expect(page.locator('[data-testid="log-panel"]')).toContainText("Request completed");
  });
});
