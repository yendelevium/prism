/**
 * Per-file setup — runs in each worker context before tests execute.
 *
 * 1. Loads DATABASE_URL from the temp file (needed for forked workers)
 * 2. Initializes the shared PrismaClient once per worker
 * 3. Truncates all tables before each test for isolation
 *
 * Note: Since fileParallelism: false guarantees test files run sequentially,
 * we don't need a single-connection (max: 1) pool to avoid FK visibility
 * issues. Eagerly calling getTestPrisma() lets the app use its default pool
 * setup gracefully.
 */

import { beforeEach, afterAll } from "vitest";
import { loadDatabaseUrl } from "./db";
import { getTestPrisma } from "./test-prisma";
import { truncateAllTables } from "../helpers/truncate";

// Load the DATABASE_URL ASAP so subsequent imports can read it
const dbUrl = loadDatabaseUrl();

// Eagerly initialize the PrismaClient singleton so all seed helpers
// and service functions use the exact same instance & connection pool
const prisma = getTestPrisma();

beforeEach(async () => {
  await truncateAllTables();
});

afterAll(async () => {
  await prisma.$disconnect();
});
