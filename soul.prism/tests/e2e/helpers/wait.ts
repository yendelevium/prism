import { Page, expect } from "@playwright/test";

/**
 * Ensures stability over generic async loading by specifically awaiting 
 * UI patterns that indicate the application context has naturally finished computing.
 */

// Toast/Snackbars
export async function waitForToast(
  page: Page,
  message: string,
  state: "attached" | "detached" | "visible" | "hidden" = "visible"
) {
  const locator = page.locator(`[data-testid="toast"]:has-text("${message}")`);
  await locator.waitFor({ state });
}

// Table loading
export async function waitForTableRows(page: Page, expectedCount: number) {
  return await expect(page.locator("tbody tr")).toHaveCount(expectedCount, { timeout: 10000 });
}

// Trace completion
export async function waitForTraceLoad(page: Page) {
  const waterfall = page.locator('[data-testid="trace-waterfall-rendered"]');
  await waterfall.waitFor({ state: "visible", timeout: 15000 });
}

// Dynamic elements 
export async function waitForWorkflowStatus(page: Page, expectedStatus: string) {
  const badge = page.locator(`[data-testid="workflow-status-badge"]:has-text("${expectedStatus}")`);
  await badge.waitFor({ state: "visible", timeout: 20000 });
}
