/**
 * Worker-only helper — provides getTestPrisma() for use in
 * seed helpers, truncation, and test files.
 *
 * This file must NEVER be imported from db.ts (the globalSetup file),
 * because it imports the app's getPrisma() which requires DATABASE_URL
 * to already be set in the environment.
 *
 * It is safe to import from:
 *   - seed.ts
 *   - truncate.ts
 *   - per-file-setup.ts
 *   - *.test.ts files
 */

import { getPrisma } from "@/backend/prisma";

/**
 * Returns the SAME PrismaClient that the service modules use.
 *
 * By delegating to the app's `getPrisma()`, tests and service logic
 * share the same PrismaClient instance and pg.Pool, ensuring that
 * data written in seed helpers is immediately visible to service
 * functions (no cross-pool FK visibility issues).
 *
 * The per-file-setup.ts setupFile pre-injects a single-connection
 * PrismaClient into globalThis.__prismPrismaClient before this is
 * ever called.
 */
export function getTestPrisma() {
  return getPrisma();
}
