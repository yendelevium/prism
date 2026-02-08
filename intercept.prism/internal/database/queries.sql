-- name: InsertSpan :exec
INSERT INTO "Span" ("id", "traceId", "spanId", "parentSpanId", "operation", "serviceName", "startTime", "duration", "status", "tags")
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT ("traceId", "spanId") DO NOTHING;

-- name: InsertRequest :one
INSERT INTO "Request" ("id", "name", "method", "url", "headers", "body", "collectionId", "createdById")
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING "id";

-- name: InsertExecution :one
INSERT INTO "Execution" ("id", "requestId", "traceId", "statusCode", "latencyMs")
VALUES ($1, $2, $3, $4, $5)
RETURNING "id";
-- name: GetServiceGraph :many
SELECT 
    s1."serviceName" as source_service,
    s2."serviceName" as target_service,
    COUNT(*) as call_count,
    AVG(s2."duration") as avg_duration,
    SUM(CASE WHEN s2."status" = 'ERROR' THEN 1 ELSE 0 END) as error_count
FROM "Span" s1
INNER JOIN "Span" s2 
    ON s1."traceId" = s2."traceId" 
    AND s1."spanId" = s2."parentSpanId"
WHERE s1."serviceName" IS NOT NULL 
    AND s2."serviceName" IS NOT NULL
GROUP BY s1."serviceName", s2."serviceName";
