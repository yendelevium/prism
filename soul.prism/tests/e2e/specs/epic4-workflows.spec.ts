import { test, expect } from "../fixtures/auth.fixture";

test.describe("E2E: Epic 4 — Scenario Automation (Workflows)", () => {
  let initialContext: { workspaceId: string; userId: string };

  test.beforeEach(async ({ authenticateAs }) => {
    initialContext = await authenticateAs("admin");
  });

  test("US 4.1 — Workflow Visual Editor", async ({ page }) => {
    await page.goto("/dashboard/workflows");
    await page.click('[data-testid="new-workflow-btn"]');
    await page.fill('[data-testid="wf-name-input"]', "User Onboarding Flow");
    
    // Simulate dropping 3 steps
    await page.click('[data-testid="add-step-btn"]');
    await page.fill('[data-testid="step-url-0"]', "https://mockserver/register");
    await page.click('[data-testid="add-step-btn"]');
    await page.fill('[data-testid="step-url-1"]', "https://mockserver/verify");
    await page.click('[data-testid="add-step-btn"]');
    await page.fill('[data-testid="step-url-2"]', "https://mockserver/welcome-email");

    await expect(page.locator('[data-testid^="workflow-step-node"]')).toHaveCount(3);

    // Reordering via visual drag handles (mock simulation logic for Playwright via dedicated order btn if not DND)
    // For this e2e, we'll assume the front-end wires this up
    await page.click('[data-testid="step-actions-2"]');
    await page.click('[data-testid="move-step-up"]');
    
    await page.click('[data-testid="save-workflow-btn"]');
    await expect(page.locator('[data-testid="workflow-list-item-User Onboarding Flow"]')).toBeVisible();
  });

  test("US 4.2 — Data Chaining", async ({ page }) => {
    await page.goto("/dashboard/workflows");
    await page.click('[data-testid="new-workflow-btn"]');

    // Step 1
    await page.click('[data-testid="add-step-btn"]');
    await page.selectOption('[data-testid="step-method-0"]', "POST");
    await page.fill('[data-testid="step-url-0"]', "http://localhost:3000/api/mock/login");
    
    // Step 2
    await page.click('[data-testid="add-step-btn"]');
    await page.fill('[data-testid="step-url-1"]', "http://localhost:3000/api/mock/profile");
    await page.fill('[data-testid="header-key-1"]', "Authorization");
    await page.fill('[data-testid="header-val-1"]', "Bearer {{steps.0.body.token}}");

    await page.click('[data-testid="save-workflow-btn"]');
    await page.click('[data-testid="run-workflow-btn"]');

    // Polling logic for async execution instead of sleeps
    await expect(page.locator('[data-testid="workflow-status-badge"]:has-text("Passed")')).toBeVisible({ timeout: 10000 });
    
    // Validate Step 2 took the token from Step 1 correctly
    await page.click('[data-testid="step-result-1"]');
    await expect(page.locator('[data-testid="step-headers-panel"]')).toContainText("Bearer test-jwt"); // Assuming local HTTP mock returns test-jwt
  });

  test("US 4.5 — Assertions", async ({ page }) => {
    await page.goto("/dashboard/workflows");
    await page.click('[data-testid="new-workflow-btn"]');
    await page.click('[data-testid="add-step-btn"]');
    await page.fill('[data-testid="step-url-0"]', "http://localhost:3000/api/mock/200");
    
    // Valid assertion
    await page.click('[data-testid="add-assertion-0"]');
    await page.fill('[data-testid="assert-key-0"]', "Status");
    await page.selectOption('[data-testid="assert-ops-0"]', "==");
    await page.fill('[data-testid="assert-val-0"]', "200");
    await page.click('[data-testid="run-workflow-btn"]');
    await expect(page.locator('[data-testid="step-status-0"]')).toHaveText("Passed");

    // Invalid Assertion
    await page.fill('[data-testid="assert-val-0"]', "500");
    await page.click('[data-testid="run-workflow-btn"]');
    await expect(page.locator('[data-testid="step-status-0"]')).toHaveText("Failed");
    await expect(page.locator('[data-testid="step-error-msg-0"]')).toContainText("Expected 500, Got 200");
  });

  test("US 4.6 — Conditional Logic", async ({ page }) => {
    await page.goto("/dashboard/workflows");
    await page.click('[data-testid="new-workflow-btn"]');
    
    await page.click('[data-testid="add-step-btn"]');
    await page.fill('[data-testid="step-url-0"]', "http://localhost:3000/api/mock/empty-array");
    
    await page.click('[data-testid="add-step-btn"]');
    await page.fill('[data-testid="step-url-1"]', "http://localhost:3000/api/mock/child");
    await page.click('[data-testid="add-condition-1"]');
    await page.fill('[data-testid="cond-exp-1"]', "steps.0.body.length == 0");

    await page.click('[data-testid="run-workflow-btn"]');
    await expect(page.locator('[data-testid="workflow-status-badge"]:has-text("Passed")')).toBeVisible();

    await expect(page.locator('[data-testid="step-status-1"]')).toHaveText("Skipped");
    await expect(page.locator('[data-testid="skip-reason-1"]')).toContainText("steps.0.body.length == 0 evaluated to true");
  });

  test("US 4.4 — Scheduled Runs", async ({ page }) => {
    await page.goto("/dashboard/workflows");
    await page.click('[data-testid="new-workflow-btn"]');
    await page.click('[data-testid="wf-settings-btn"]');
    
    await page.check('[data-testid="enable-schedule-chk"]');
    await page.fill('[data-testid="cron-input"]', "0 9 * * *");
    await page.click('[data-testid="save-schedule-btn"]');
    await page.click('[data-testid="save-workflow-btn"]');

    await expect(page.locator('[data-testid="workflow-schedule-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-run-time"]')).toContainText("Next run:");
  });
});
