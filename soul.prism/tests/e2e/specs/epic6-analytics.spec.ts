import { test, expect } from "../fixtures/auth.fixture";

test.describe("E2E: Epic 6 — Analytics & Reporting", () => {
  let initialContext: { workspaceId: string; userId: string };

  test.beforeEach(async ({ authenticateAs }) => {
    initialContext = await authenticateAs("admin");
  });

  test("US 6.1 — Health Score Widget", async ({ page }) => {
    await page.goto("/dashboard/analytics");
    
    // Assert visual health score
    const scoreWidget = page.locator('[data-testid="health-score-widget"]');
    await expect(scoreWidget).toBeVisible({ timeout: 15000 }); // Analytics might take a moment to aggregate

    const text = await scoreWidget.innerText();
    expect(parseInt(text)).toBeGreaterThanOrEqual(0);
    expect(parseInt(text)).toBeLessThanOrEqual(100);
  });

  test("US 6.2 — Status Code Distribution Chart", async ({ page }) => {
    await page.goto("/dashboard/analytics");
    await expect(page.locator('[data-testid="status-chart-pie"]')).toBeVisible();

    // Check legend exists
    await expect(page.locator('.recharts-legend-item-text')).toHaveCount(4); // e.g. 200, 404, 500, Unknown
  });

  test("US 6.3 — Latency Trend Chart", async ({ page }) => {
    await page.goto("/dashboard/analytics");
    await expect(page.locator('[data-testid="latency-trend-line"]')).toBeVisible();
    
    // Check points
    const lines = page.locator('.recharts-line-dots circle');
    expect(await lines.count()).toBeGreaterThanOrEqual(2);
  });

  test("US 6.4 — Top Failing Endpoints", async ({ page }) => {
    await page.goto("/dashboard/analytics");
    const failingList = page.locator('[data-testid="failing-endpoints-list"]');
    await expect(failingList).toBeVisible();

    // Elements should be ordered if ranked
    const firstEndpoint = failingList.locator('[data-testid="endpoint-rank-1"]');
    await expect(firstEndpoint).toBeVisible();

    await firstEndpoint.click();
    await expect(page).toHaveURL(/.*dashboard\/requests\/.*/); // Navigated successfully to drill down
  });

  test("US 6.6 — Report Export", async ({ page }) => {
    await page.goto("/dashboard/analytics");

    // Test CSV Download
    const [csvDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.click('[data-testid="export-csv-btn"]'),
    ]);
    expect(csvDownload.suggestedFilename()).toMatch(/\.csv$/);

    // Test PDF Download
    const [pdfDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.click('[data-testid="export-pdf-btn"]'),
    ]);
    expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test("US 6.7 — Time Range Filter", async ({ page }) => {
    await page.goto("/dashboard/analytics");

    // Switch to 7 days
    await page.selectOption('[data-testid="time-range-select"]', "7d");
    await expect(page.locator('[data-testid="analytics-loading-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="analytics-loading-overlay"]')).toBeHidden();

    // Verify filter activated state
    await expect(page.locator('[data-testid="time-range-select"]')).toHaveValue("7d");

    // Switch to 30 days
    await page.selectOption('[data-testid="time-range-select"]', "30d");
    await expect(page.locator('[data-testid="analytics-loading-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="analytics-loading-overlay"]')).toBeHidden();
    
    // Verify it updated the underlying charts without breaking
    await expect(page.locator('[data-testid="health-score-widget"]')).toBeVisible();
  });
});
