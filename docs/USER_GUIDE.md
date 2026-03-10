# PRISM User Guide

> A unified platform for API testing, distributed tracing, and analytics.

## Table of Contents

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Using the Platform](#using-the-platform)
  - [Signing Up & Signing In](#signing-up--signing-in)
  - [Workspaces](#workspaces)
  - [Collections](#collections)
  - [Building & Sending Requests](#building--sending-requests)
  - [Reading Responses](#reading-responses)
  - [Distributed Tracing](#distributed-tracing)
  - [Analytics Dashboard](#analytics-dashboard)
- [Environment Variables](#environment-variables)
- [Running Locally (Development)](#running-locally-development)
  - [Database Only](#database-only)
  - [Full Stack (Docker Compose)](#full-stack-docker-compose)
  - [Individual Services](#individual-services)
- [Troubleshooting](#troubleshooting)

## Getting Started

PRISM is composed of two services and a database:

| Component | Role | Default Port |
|-----------|------|--------------|
| **soul.prism** | Web UI (Next.js) — the Control Plane | `3000` |
| **intercept.prism** | API proxy (Go/Gin) — the Data Plane | `7000` |
| **pg_duckdb** | PostgreSQL + DuckDB hybrid storage | `5432` |

All three are orchestrated via Docker Compose.

## Prerequisites

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Docker & Docker Compose | Latest | Container runtime |
| Git | Any | Clone the repository |
| Bun | 1.0+ | soul.prism dev server *(dev only)* |
| Go | 1.25+ | intercept.prism dev server *(dev only)* |

> [!NOTE]
> For **production** deployment you only need Docker — Bun and Go are not required since the services run in containers.

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/prism.git
cd prism

# 2. Create your environment file
cp .example.env .env
# Edit .env with a text editor and fill in all values (see Environment Variables below)

# 3. Create the persistent database volume
make configure

# 4. Build and start all services
make compose-up
```

Once started, open **http://localhost:3000** in your browser.

## Using the Platform

### Signing Up & Signing In

PRISM uses [Clerk](https://clerk.com/) for authentication.

1. Navigate to **http://localhost:3000** (or your production domain).
2. Click **Sign Up** to create a new account, or **Sign In** if you already have one.
3. After authentication you are redirected to the **Dashboard**.

### Workspaces

Workspaces are the top-level organizational unit. Each workspace has its own collections, requests, and team members.

- **Create a Workspace** — use the workspace selector in the dashboard sidebar.
- **Switch Workspaces** — click the workspace name in the sidebar to open the workspace picker.
- Each user can belong to multiple workspaces (multi-tenant).

### Collections

Collections group related API requests (similar to Postman collections).

- **Create a Collection** — click the **+** button in the sidebar under your workspace.
- **Rename / Delete** — right-click a collection name for context options.
- Collections are scoped to the active workspace.

### Building & Sending Requests

1. **Select a Collection** — click a collection in the sidebar to expand it.
2. **Create a New Request** — click the **+** icon next to the collection name.
3. **Configure the Request**:
   - **Method** — select `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, etc. from the dropdown.
   - **URL** — enter the target API URL.
   - **Headers** — add key-value pairs in the *Headers* tab.
   - **Query Params** — add key-value pairs in the *Params* tab.
   - **Body** — switch to the *Body* tab and enter JSON in the Monaco editor.
4. **Send** — click the **Send** button. The request is routed through `intercept.prism` which:
   - Injects a W3C `traceparent` header for distributed tracing.
   - Records latency, status codes, and sizes.
   - Persists execution data asynchronously.

### Reading Responses

After a request completes, the response panel shows:

| Tab | Content |
|-----|---------|
| **Body** | Full response body (JSON, HTML, text, etc.) |
| **Headers** | Response headers |
| **Timing** | Duration, request size, response size |

The **status code** badge is displayed at the top of the response panel with color coding:
- 🟢 `2xx` — Success
- 🟡 `3xx` — Redirect
- 🟠 `4xx` — Client Error
- 🔴 `5xx` — Server Error

### Distributed Tracing

Every request proxied through `intercept.prism` gets a unique **Trace ID** and **Span ID**.

- **Bottom Panel → Trace** — displays the trace ID and a list of spans.
- **Gantt Chart** — visualizes span timing as a horizontal bar chart.
- **Service Map** — shows the directed graph of services involved in the trace.

If your downstream services support OpenTelemetry, they can push their spans to `intercept.prism` at:

```
POST http://<intercept-host>:7000/v1/traces
Content-Type: application/x-protobuf   # or application/json
```

These spans will be stitched into the same trace automatically.

### Analytics Dashboard

Navigate to **/analytics** from the sidebar. The dashboard displays:

- **P50 / P95 / P99 latency** over configurable time windows.
- **Success vs. failure rates** as a time-series chart.
- **Most frequent endpoints**.
- **Response time distributions**.

Analytics queries leverage **pg_duckdb's columnar OLAP engine** for sub-second performance on large datasets — no ETL required.

## Environment Variables

Create a `.env` file in the project root based on `.example.env`:

```bash
# Database
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=your_db_name
POSTGRES_PORT=5432

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# intercept.prism
SWAGGER_HOST=localhost:7000

# soul.prism
INTERCEPT_URL=http://intercept.prism:7000   # Docker service name
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up
CLERK_AFTER_SIGN_IN_URL=/dashboard
CLERK_AFTER_SIGN_UP_URL=/dashboard
```

> [!IMPORTANT]
> The `INTERCEPT_URL` must use the Docker **service name** (`intercept.prism`) when running in Docker Compose. Use `localhost` only for local bare-metal development.

### Getting Clerk Keys

1. Create a free application at [clerk.com](https://clerk.com/).
2. Go to **API Keys** in the Clerk dashboard.
3. Copy the **Publishable Key** and **Secret Key** into your `.env`.

## Running Locally (Development)

### Database Only

Start just the database (and Drizzle Gateway UI) for frontend/backend development:

```bash
docker compose -f compose.db.yml up -d
```

- **pg_duckdb** → `localhost:5432`
- **Drizzle Gateway** → `http://localhost:4983`

### Full Stack (Docker Compose)

Build and start everything:

```bash
make compose-up
```

Stop everything:

```bash
make compose-down
```

### Individual Services

#### soul.prism (Frontend)

```bash
cd soul.prism
cp .example.env .env.local
bun install
make dev          # starts DB + Next.js dev server
```

#### intercept.prism (Backend)

```bash
cd intercept.prism
cp .example.env .env
go mod download
make dev          # starts DB + builds & runs Go binary
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Database connection failed** | Ensure the DB container is running (`docker ps`). Verify `DATABASE_URL` in your `.env`. |
| **Clerk auth errors** | Double-check your Clerk keys. Ensure the domain is whitelisted in the Clerk dashboard. |
| **Port conflict on 5432** | Another PostgreSQL may be running locally. Stop it or change `POSTGRES_PORT`. |
| **Prisma client not generated** | Run `bunx prisma generate` inside `soul.prism/`. |
| **Swagger UI not loading** | Run `make docs` inside `intercept.prism/` to regenerate the OpenAPI spec. |
| **Monaco Editor blank** | Clear the Next.js cache: `rm -rf soul.prism/.next` then restart. |
| **Request timeout** | Default is 30 s. Verify the target API is reachable and network connectivity is stable. |
