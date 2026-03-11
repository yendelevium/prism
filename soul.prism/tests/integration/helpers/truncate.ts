/**
 * Truncates every table in FK-safe order so that each test
 * starts with a completely clean database.
 *
 * Called from `beforeEach` in the shared setupFile.
 */

import { getTestPrisma } from "../setup/test-prisma";

/**
 * Tables listed in reverse-dependency (leaf → root) order.
 * This avoids FK-constraint violations when truncating.
 */
const TABLES_IN_FK_ORDER = [
  "WorkflowRunStep",
  "WorkflowRun",
  "WorkflowStep",
  "Workflow",
  "Execution",
  "GRPCRequest",
  "GraphQLRequest",
  "Request",
  "Environment",
  "Collection",
  "UserWorkspace",
  "Workspace",
  "User",
  "Span",
] as const;

/**
 * Truncates all application tables using TRUNCATE … CASCADE
 * which handles FK ordering automatically in PostgreSQL,
 * but we still list them explicitly for clarity.
 */
export async function truncateAllTables(): Promise<void> {
  const prisma = getTestPrisma();

  // Use a single TRUNCATE statement with CASCADE for atomicity
  const tableList = TABLES_IN_FK_ORDER.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} CASCADE`);
}
