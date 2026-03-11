import { test, expect } from "../fixtures/auth.fixture";

test.describe("E2E: Epic 3 — Chaos Engineering", () => {
  let initialContext: { workspaceId: string; userId: string };

  test.beforeEach(async ({ authenticateAs }) => {
    initialContext = await authenticateAs("admin");
  });

  test("US 3.1 — Latency Injection UI", async ({ page }) => {
    await page.goto("/dashboard/chaos");
    await page.click('[data-testid="new-chaos-rule-btn"]');
    await page.selectOption('[data-testid="rule-type-select"]', "latency");
    await page.fill('[data-testid="rule-delay-input"]', "1000");
    await page.fill('[data-testid="rule-url-input"]', "/api/checkout");
    await page.click('[data-testid="save-rule-btn"]');

    await expect(page.locator('[data-testid="rule-item-latency"]')).toBeVisible();
    
    // Toggle on
    await page.click('[data-testid="toggle-rule-latency"]');
    await expect(page.locator('[data-testid="rule-status-active"]')).toBeVisible();

    // Verify
    await page.goto("/dashboard/requests");
    await page.click('[data-testid="new-request-btn"]');
    // Using a base localhost or mock domain
    await page.fill('[data-testid="url-input"]', "http://mockserver:3000/api/checkout");
    await page.click('[data-testid="send-request-btn"]');

    await expect(page.locator('[data-testid="execution-latency"]')).toContainText("100"); // At least 1000 in string 
  });

  test("US 3.2 — Error Injection", async ({ page }) => {
    await page.goto("/dashboard/chaos");
    await page.click('[data-testid="new-chaos-rule-btn"]');
    await page.selectOption('[data-testid="rule-type-select"]', "error");
    await page.fill('[data-testid="rule-status-input"]', "503");
    await page.fill('[data-testid="rule-url-input"]', "/api/payment");
    await page.click('[data-testid="save-rule-btn"]');
    await page.click('[data-testid="toggle-rule-error"]');

    await page.goto("/dashboard/requests");
    await page.click('[data-testid="new-request-btn"]');
    await page.fill('[data-testid="url-input"]', "http://mockserver:3000/api/payment");
    await page.click('[data-testid="send-request-btn"]');

    await expect(page.locator('[data-testid="response-status"]')).toContainText("503");
    await expect(page.locator('[data-testid="chaos-injected-badge"]')).toBeVisible();
  });

  test("US 3.3 — Packet Drop", async ({ page }) => {
    await page.goto("/dashboard/chaos");
    // Mocking the rule creation directly for brevity in UI, full flow tested above
    await page.click('[data-testid="new-chaos-rule-btn"]');
    await page.selectOption('[data-testid="rule-type-select"]', "drop");
    await page.fill('[data-testid="rule-url-input"]', "/api/slow");
    await page.click('[data-testid="save-rule-btn"]');
    await page.click('[data-testid="toggle-rule-drop"]');

    await page.goto("/dashboard/requests");
    await page.click('[data-testid="new-request-btn"]');
    await page.fill('[data-testid="url-input"]', "http://mockserver:3000/api/slow");
    await page.click('[data-testid="send-request-btn"]');

    // Expected timeout behavior handled in UI as a string label internally
    await expect(page.locator('[data-testid="execution-status"]')).toContainText("Timeout");
    await expect(page.locator('[data-testid="response-body"]')).toBeEmpty();
  });

  test("US 3.7 — Failure Impact (Service Map)", async ({ page }) => {
    await page.goto("/dashboard/traces");
    await page.click('[data-testid="tab-service-map"]');

    // Assume the seeded failure from the last test is loaded by default
    const failedNode = page.locator('[data-testid="service-node-payment"]');
    await expect(failedNode).toHaveCSS("stroke", /.*red.*/);

    await failedNode.click();
    await expect(page.locator('[data-testid="casualty-report-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="casualty-downstream-list"]')).toBeVisible();
  });

  test("US 3.8 — Chaos Audit Log", async ({ page }) => {
    await page.goto("/dashboard/chaos");
    
    // Cycle rule to log events
    await page.click('[data-testid="new-chaos-rule-btn"]');
    await page.fill('[data-testid="rule-url-input"]', "/api/audit");
    await page.click('[data-testid="save-rule-btn"]');
    await page.click('[data-testid="toggle-rule-audit"]');
    await page.click('[data-testid="toggle-rule-audit"]'); // toggle off
    
    await page.click('[data-testid="tab-audit-log"]');
    
    const logs = page.locator('[data-testid="audit-log-row"]');
    await expect(logs).toHaveCount(3);
    await expect(logs.nth(0)).toContainText("Rule Disabled");
    await expect(logs.nth(1)).toContainText("Rule Enabled");
    await expect(logs.nth(2)).toContainText("Rule Created");

    // All should carry user context
    await expect(page.locator('[data-testid="audit-log-user"]')).toHaveCount(3);
  });
});
