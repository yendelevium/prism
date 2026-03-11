/**
 * Integration-test DB bootstrap.
 *
 * Starts a PostgreSQL Testcontainer, runs 'prisma migrate deploy',
 * then writes the DATABASE_URL to a temp file so forked workers can
 * pick it up.
 *
 * ⚠️  This file runs as globalSetup — in a SEPARATE PROCESS from the
 * test workers.  It must NOT import any app-level module that reads
 * DATABASE_URL at import time (like @/backend/prisma).
 *
 * Lifecycle:
 *   globalSetup  → setup()   — container + migrations
 *   globalTeardown → teardown() — stop container
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Temp file used to pass DATABASE_URL from globalSetup to worker forks */
const URL_FILE = path.join(__dirname, ".db-url");

/** Project root (soul.prism/) */
const PROJECT_ROOT = path.resolve(__dirname, "../../..");

/* ------------------------------------------------------------------ */
/*  Module-level state                                                 */
/* ------------------------------------------------------------------ */

let container: StartedPostgreSqlContainer | undefined;

/* ------------------------------------------------------------------ */
/*  globalSetup                                                        */
/* ------------------------------------------------------------------ */

export async function setup(): Promise<void> {
  console.log("\n🐳  Starting PostgreSQL Testcontainer …");

  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("prism_test")
    .withUsername("test")
    .withPassword("test")
    .withExposedPorts(5432)
    .start();

  const databaseUrl = container.getConnectionUri();
  console.log(`✅  Container ready — ${databaseUrl}`);

  // Write URL to temp file so forked workers can read it
  fs.writeFileSync(URL_FILE, databaseUrl, "utf-8");

  // Also set it in this process for the migration command
  process.env.DATABASE_URL = databaseUrl;

  // Run Prisma migrations
  const schemaPath = path.join(PROJECT_ROOT, "prisma", "schema.prisma");
  console.log("🔄  Running prisma migrate deploy …");
  execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
    cwd: PROJECT_ROOT,
  });
  console.log("✅  Migrations applied.");
}

/* ------------------------------------------------------------------ */
/*  globalTeardown                                                     */
/* ------------------------------------------------------------------ */

export async function teardown(): Promise<void> {
  console.log("\n🧹  Tearing down …");

  // Clean up the temp file
  try {
    fs.unlinkSync(URL_FILE);
  } catch {
    // ignore
  }

  if (container) {
    await container.stop();
    container = undefined;
  }
  console.log("✅  Testcontainer stopped.");
}

/* ------------------------------------------------------------------ */
/*  Helpers importable by individual test files                        */
/* ------------------------------------------------------------------ */

/**
 * Reads DATABASE_URL from the temp file written by globalSetup and sets
 * it in process.env.  Called once per worker fork from the setupFile.
 */
export function loadDatabaseUrl(): string {
  // Already loaded?
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (!fs.existsSync(URL_FILE)) {
    throw new Error(
      `DB URL file not found at ${URL_FILE} — was the integration globalSetup executed?`,
    );
  }

  const url = fs.readFileSync(URL_FILE, "utf-8").trim();
  process.env.DATABASE_URL = url;
  return url;
}
