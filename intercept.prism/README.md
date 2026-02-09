# INTERCEPT.PRISM [WIP]
_Currently a work in progress_

> **The Data Plane** – A high-performance Go proxy server for API execution and distributed tracing.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Service](#running-the-service)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
  - [Request Flow](#request-flow)
  - [Async Database Writes](#async-database-writes)
  - [Distributed Tracing](#distributed-tracing)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [REST Proxy](#rest-proxy)
  - [OTEL Traces Endpoint](#otel-traces-endpoint)
  - [Analytics](#analytics)
- [Available Commands](#available-commands)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Future Roadmap](#future-roadmap)

## Overview

`intercept.prism` is the execution engine of the PRISM platform. It's designed for high-throughput, low-latency API proxying with built-in observability.

### Core Responsibilities

- **Proxy HTTP Requests** – Route API calls to target servers
- **Inject Tracing** – Add W3C `traceparent` headers for distributed tracing
- **Capture Metrics** – Record latency, status codes, request/response sizes
- **Receive OTEL Data** – Accept OpenTelemetry spans via `/v1/traces`
- **Async Persistence** – Stream data to PostgreSQL without blocking responses
- **Analytics Queries** – Serve aggregated metrics to the frontend

## Tech Stack

| Category | Technology |
|----------|------------|
| **Language** | Go 1.25 |
| **HTTP Framework** | [Gin](https://gin-gonic.com/) |
| **Database Driver** | [pgx v5](https://github.com/jackc/pgx) |
| **OpenTelemetry** | [OTLP Proto](https://opentelemetry.io/docs/specs/otlp/) |
| **API Documentation** | [Swag](https://github.com/swaggo/swag) + [Swagger UI](https://swagger.io/tools/swagger-ui/) |
| **Testing** | Go standard testing + [testify](https://github.com/stretchr/testify) |
| **Configuration** | [godotenv](https://github.com/joho/godotenv) |

## Getting Started

### Prerequisites

- **Go** 1.21+ ([Install Go](https://go.dev/dl/))
- **PostgreSQL** with pg_duckdb extension (via Docker)
- **Docker** (for containerized deployment)

### Installation

```bash
# Navigate to the intercept.prism directory
cd intercept.prism

# Set up environment variables
cp .example.env .env
# Edit .env with your database connection string

# Download dependencies
go mod download
```

### Running the Service

```bash
# Development mode (with hot reload via Docker)
make dev

# Run directly (without Docker)
go run ./cmd/intercept.prism/

# Production build
make build

# Run production binary
./intercept.prism
```

The service will be available at `http://localhost:7000`.

## Project Structure

```
intercept.prism/
├── cmd/
│   └── intercept.prism/
│       └── main.go               # Application entrypoint
│
├── internal/
│   ├── routes/
│   │   ├── index.go              # Router setup
│   │   ├── rest.go               # REST proxy handler
│   │   ├── rest_test.go          # REST handler tests
│   │   └── analytics.go          # Analytics endpoints
│   │
│   ├── store/
│   │   ├── request.go            # Request record buffering
│   │   ├── execution.go          # Execution record buffering
│   │   ├── span.go               # Span record buffering
│   │   └── flush.go              # Async database flush logic
│   │
│   ├── database/
│   │   ├── connect.go            # PostgreSQL connection pool
│   │   ├── request.go            # Request CRUD queries
│   │   ├── execution.go          # Execution CRUD queries
│   │   ├── span.go               # Span CRUD queries
│   │   └── queries.sql.go        # SQLC generated queries
│   │
│   └── tracing/
│       ├── traceid.go            # W3C Trace ID generation
│       └── spanid.go             # Span ID generation
│
├── model/
│   ├── rest.go                   # Request/Response models
│   └── span.go                   # Span/Trace models
│
├── docs/
│   ├── swagger.json              # OpenAPI specification
│   ├── swagger.yaml              # OpenAPI specification (YAML)
│   └── docs.go                   # Swag generated docs
│
├── Dockerfile                    # Multi-stage Docker build
├── Makefile                      # Development commands
├── go.mod                        # Go module definition
├── go.sum                        # Dependency checksums
├── sqlc.yaml                     # SQLC configuration
└── compose.yml                   # Docker Compose for development
```

## Architecture

### Request Flow

```
┌─────────────┐       ┌─────────────────┐       ┌──────────────┐
│ soul.prism  │──────▶│ intercept.prism │──────▶│ Target API   │
│  (Client)   │       │    (Proxy)      │       │ (e.g. Google)│
└─────────────┘       └─────────────────┘       └──────────────┘
                              │
                              │ Async Write
                              ▼
                      ┌─────────────────┐
                      │   PostgreSQL    │
                      │  (pg_duckdb)    │
                      └─────────────────┘
```

1. **Request Received** – Client sends request configuration
2. **Trace Context Generated** – Generate `traceId` and `spanId`
3. **Headers Injected** – Add `traceparent` header for downstream tracing
4. **Request Proxied** – Execute HTTP request to target API
5. **Response Captured** – Record status, headers, body, timing
6. **Data Queued** – Add records to in-memory buffer (non-blocking)
7. **Response Returned** – Send response to client immediately
8. **Async Flush** – Background goroutine writes buffered data to DB

### Async Database Writes

To minimize response latency, database writes are decoupled from the request/response cycle:

```go
// Non-blocking add to buffer
store.AddRequest(requestRecord)
store.AddExecution(executionRecord)
store.AddSpan(spanRecord)

// Background goroutine flushes every N seconds or M records
go store.FlushLoop(ctx)
```

### Distributed Tracing

intercept.prism generates and propagates W3C Trace Context headers:

```
┌─────────────────────────────────────────────────────────────┐
│                    traceparent header                       │
│   00-{trace-id}-{span-id}-{flags}                           │
│   00-abc123...def456...-fedcba...-01                        │
└─────────────────────────────────────────────────────────────┘
```

- **Version**: `00` (current W3C version)
- **Trace ID**: 32-character hex string (shared across all spans in a trace)
- **Span ID**: 16-character hex string (unique per span)
- **Flags**: `01` (sampled)

## Environment Variables

Create a `.env` file based on `.example.env`:

```bash
DATABASE_URL=postgresql://username:password@localhost:5433/prism?sslmode=disable
```

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | HTTP server port | `7000` |
| `GIN_MODE` | Gin framework mode (`debug`/`release`) | `debug` |

## API Reference

### REST Proxy

Execute an HTTP request through the proxy with automatic tracing.

```http
POST /rest/
Content-Type: application/json
```

**Request Body:**

```json
{
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": {
    "Authorization": "Bearer token123",
    "Accept": "application/json"
  },
  "body": "",
  "collectionId": "col_abc123",
  "createdById": "user_def456"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "body": "{\"users\": [{\"id\": 1, \"name\": \"John\"}]}",
  "headers": {
    "Content-Type": "application/json",
    "X-Request-Id": "req_123"
  },
  "duration": "125ms",
  "responseSize": 1234,
  "requestSize": 56,
  "requestId": "req_abc123",
  "executionId": "exec_def456",
  "traceId": "abc123def456789...",
  "spanId": "fedcba987654...",
  "spans": [
    {
      "spanId": "fedcba987654...",
      "traceId": "abc123def456789...",
      "operation": "GET https://api.example.com/users",
      "serviceName": "intercept.prism",
      "startTime": 1707500000000000,
      "duration": 125000,
      "status": "OK",
      "tags": {
        "http.method": "GET",
        "http.url": "https://api.example.com/users",
        "http.status_code": "200"
      }
    }
  ],
  "error": ""
}
```

### OTEL Traces Endpoint

Receive OpenTelemetry trace data from upstream services.

```http
POST /v1/traces
Content-Type: application/x-protobuf
```

Or with JSON:

```http
POST /v1/traces
Content-Type: application/json
```

**Request Body:** OTLP ExportTraceServiceRequest (protobuf or JSON)

**Response:**

```json
{
  "status": "ok",
  "spansReceived": 5
}
```

### Analytics

Retrieve aggregated metrics for the analytics dashboard.

```http
GET /analytics/latency?period=24h&percentile=p99
```

**Response:**

```json
{
  "period": "24h",
  "percentile": "p99",
  "value": 245.5,
  "unit": "ms"
}
```

## Available Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start development server with Docker |
| `make build` | Build production binary |
| `make test` | Run test suite |
| `make docs` | Generate Swagger documentation |
| `make down` | Stop Docker containers |


## Testing

### Running Tests

```bash
# Run all tests
make test

# Run with verbose output
go test -v ./...

# Run specific package tests
go test -v ./internal/routes/

# Run with coverage
go test -cover ./...
```

### Test Files

Tests are suffixed with `_test.go` and colocated with source files:

| File | Coverage |
|------|----------|
| `routes/rest_test.go` | REST proxy handler tests |
| `tracing/traceid_test.go` | Trace ID generation tests |
| `tracing/spanid_test.go` | Span ID generation tests |

### Writing Tests

```go
// internal/routes/rest_test.go
func TestExecuteRequest_Success(t *testing.T) {
    router := setupTestRouter()
    
    body := `{
        "method": "GET",
        "url": "https://httpbin.org/get",
        "headers": {},
        "body": ""
    }`
    
    req := httptest.NewRequest("POST", "/rest/", strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusOK, w.Code)
}
```

## API Documentation

### Generating Docs

```bash
make docs
```

This uses `swag` to generate OpenAPI documentation from code comments.

### Viewing Docs

When the server is running, visit:

```
http://localhost:7000/swagger/index.html
```

### Writing API Comments

Use Swag-style comments above handler functions:

```go
// executeRequest godoc
// @Summary      Execute an HTTP request
// @Description  Proxies an HTTP request to a target URL with tracing enabled
// @Tags         REST
// @Accept       json
// @Produce      json
// @Param        request body model.RestRequest true "Request configuration"
// @Success      200 {object} model.RestResponse "Successful response"
// @Failure      400 {object} model.RestResponse "Invalid request"
// @Failure      500 {object} model.RestResponse "Server error"
// @Router       /rest/ [post]
func executeRequest(c *gin.Context) {
    // ...
}
```

## Future Roadmap

### Planned Features

- [ ] **gRPC Support** – Proxy and trace gRPC requests
- [ ] **GraphQL Support** – Parse and trace GraphQL queries
- [ ] **WebSocket Support** – Bidirectional connection tracing
- [ ] **Chaos Injection** – Inject latency, errors, and failures
- [ ] **Request Replay** – Re-execute historical requests
- [ ] **Rate Limiting** – Per-collection rate limits
- [ ] **Circuit Breaker** – Automatic failure detection

### Code Improvements

- [ ] Refactor OTEL proto/JSON parsers
- [ ] Add connection pooling optimization
- [ ] Implement graceful shutdown
- [ ] Add Prometheus metrics endpoint

## Troubleshooting

### Common Issues

**Database connection failed:**
```
Error: failed to connect to database
```
- Ensure pg_duckdb container is running: `docker ps`
- Verify `DATABASE_URL` in `.env`
- Check if port 5433 is accessible

**Swagger UI not loading:**
```bash
# Regenerate docs
make docs

# Restart server
make dev
```

**Request timeout:**
- Default timeout is 30 seconds
- Check target API availability
- Verify network connectivity
