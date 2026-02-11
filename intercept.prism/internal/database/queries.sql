-- name: InsertSpan :exec
INSERT INTO "Span" ("id", "traceId", "spanId", "parentSpanId", "operation", "serviceName", "startTime", "duration", "status", "tags")
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT ("traceId", "spanId") DO NOTHING;

-- name: InsertExecution :one
INSERT INTO "Execution" ("id", "requestId", "traceId", "statusCode", "latencyMs")
VALUES ($1, $2, $3, $4, $5)
RETURNING "id";
