import { test, expect } from "../fixtures/auth.fixture";

test.describe("E2E: Epic 2 — Distributed Tracing", () => {
  let initialContext: { workspaceId: string; userId: string };

  test.beforeEach(async ({ authenticateAs }) => {
    initialContext = await authenticateAs("admin");
  });

  test("US 2.2 — Trace-to-Request Correlation", async ({ page }) => {
    // Send a request first
    await page.goto("/dashboard/requests");
    await page.click('[data-testid="new-request-btn"]');
    await page.fill('[data-testid="url-input"]', "https://httpbin.org/get");
    await page.click('[data-testid="send-request-btn"]');

    await expect(page.locator('[data-testid="response-status"]')).toBeVisible();

    // Trace button appears
    await expect(page.locator('[data-testid="view-trace-btn"]')).toBeVisible();
    await page.click('[data-testid="view-trace-btn"]');

    // Correlation checking
    await expect(page).toHaveURL(/\/dashboard\/traces\/[a-zA-Z0-9-]+/);
    await expect(page.locator('[data-testid="trace-waterfall"]')).toBeVisible();
  });

  test("US 2.3 — Waterfall Visualization", async ({ page }) => {
    // Rely on seeded data for guaranteed waterfalls. 
    // In our simplified mock, we assume navigating to traces loads standard view state
    await page.goto("/dashboard/traces");
    await expect(page.locator('[data-testid="trace-waterfall-rendered"]')).toBeVisible({ timeout: 15000 });

    const spanBars = page.locator('[data-testid^="span-bar-"]');
    expect(await spanBars.count()).toBeGreaterThanOrEqual(1);

    // Hover tooltip
    await spanBars.first().hover();
    await expect(page.locator('[data-testid="span-tooltip"]')).toBeVisible();

    // Check color statuses
    const errorSpans = page.locator('[data-testid^="span-bar-error-"]');
    if (await errorSpans.count() > 0) {
      await expect(errorSpans.first()).toHaveCSS("background-color", /.*red.*/);
    }
  });

  test("US 2.4 — Service Map", async ({ page }) => {
    await page.goto("/dashboard/traces");
    await page.click('[data-testid="tab-service-map"]');

    await expect(page.locator('[data-testid="service-node"]')).toHaveCount(4); // Assumption of seeded nodes
    const firstNode = page.locator('[data-testid="service-node"]').first();
    await firstNode.hover();

    await expect(page.locator('[data-testid="service-edge-highlight"]')).toBeVisible();
    await expect(page.locator('[data-testid="edge-label-count"]')).toBeVisible();
  });

  test("US 2.5 — Span Drill-Down", async ({ page }) => {
    await page.goto("/dashboard/traces");
    await expect(page.locator('[data-testid="trace-waterfall-rendered"]')).toBeVisible();

    await page.click('[data-testid^="span-bar-"] >> nth=0');
    
    // Side panel opening
    await expect(page.locator('[data-testid="span-detail-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="span-attributes-table"] [data-testid^="attr-key-"]')).toHaveCount(2);

    await page.click('[data-testid="close-span-detail-btn"]');
    await expect(page.locator('[data-testid="span-detail-panel"]')).toBeHidden();
    
    // Waterfall should remain intact
    await expect(page.locator('[data-testid="trace-waterfall-rendered"]')).toBeVisible();
  });

  test("US 2.6 — Advanced Filtering", async ({ page }) => {
    await page.goto("/dashboard/traces");

    await page.click('[data-testid="filter-bar-input"]');
    await page.fill('[data-testid="filter-bar-input"]', "service:payment");
    await page.press('[data-testid="filter-bar-input"]', "Enter");

    await expect(page.locator('[data-testid="span-bar-payment"]')).toBeVisible();
    await expect(page.locator('[data-testid="span-bar-auth"]')).toBeHidden();

    // Compound queries
    await page.fill('[data-testid="filter-bar-input"]', "service:payment duration:>2000");
    await page.press('[data-testid="filter-bar-input"]', "Enter");
    
    // Only slow runs remain
    const spans = await page.locator('[data-testid^="span-bar-"]').count();
    expect(spans).toBeLessThanOrEqual(2);

    // Clear filters
    await page.click('[data-testid="clear-filters-btn"]');
    await expect(page.locator('[data-testid^="span-bar-"]')).toHaveCount(10); // Unfiltered state
  });
});
