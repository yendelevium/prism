-- Schema for sqlc code generation ONLY
-- Actual migrations are handled by soul.prism (Prisma)

CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'DELETE');

CREATE TABLE "Request" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "method" "HttpMethod" NOT NULL,
    "url" TEXT NOT NULL,
    "headers" JSONB,
    "body" TEXT,
    "collectionId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Execution" (
    "id" TEXT PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "statusCode" INTEGER,
    "latencyMs" INTEGER,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("requestId") REFERENCES "Request"("id")
);

CREATE TABLE "Span" (
    "id" TEXT PRIMARY KEY,
    "traceId" TEXT NOT NULL,
    "spanId" TEXT NOT NULL,
    "parentSpanId" TEXT,
    "operation" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "startTime" BIGINT NOT NULL,
    "duration" BIGINT NOT NULL,
    "status" TEXT,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("traceId", "spanId")
);
