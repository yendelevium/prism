# PRISM [WIP]
_Currently a work in progress_

> **A unified platform for API testing, distributed tracing, chaos injection, test automation, and analytics.**

![Prism Architecture](images/prism_architecture.png)


## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Control Plane (soul.prism)](#control-plane-soulprism)
  - [Data Plane (intercept.prism)](#data-plane-interceptprism)
  - [Data Layer (PostgreSQL + pg_duckdb)](#data-layer-postgresql--pg_duckdb)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Docker Services](#docker-services)
- [Contributing](#contributing)
- [Team](#team)

## Overview

PRISM is a modern API development platform that combines the functionality of API clients like Postman with powerful distributed tracing, analytics, and (planned) chaos engineering capabilities. It follows a **Control Plane / Data Plane** separation pattern designed to handle high-throughput API testing without compromising user interface responsiveness.

### Key Features

- **API Request Builder** - Create and organize HTTP requests with collections and workspaces
- **Distributed Tracing** - Full W3C Trace Context support with span visualization
- **Analytics Dashboard** - P99 latency, success rates, and historical trends
- **Authentication** - Secure multi-tenant access via Clerk
- **Hybrid Storage** - OLTP + OLAP in a single PostgreSQL instance via pg_duckdb
- **Docker-First** - Simple deployment with Docker Compose

## Architecture

### Control Plane (soul.prism)

The **"Brain"** of the platform. A Next.js 16 application that handles:

- **User Interface** - Modern React-based dashboard for request building and analytics
- **Authentication** - Clerk-based authentication with workspace-level RBAC
- **Data Management** - Prisma ORM for user data, collections, and configurations
- **Analytics Rendering** - Charts and dashboards powered by Recharts

**Port:** `3000`

[See soul.prism Developer Docs](./soul.prism/README.md)

### Data Plane (intercept.prism)

The **"Muscle"** of the platform. A high-performance Go service that:

- **Proxies HTTP Requests** - Routes API calls through the proxy with observability headers
- **Injects Tracing** - Adds W3C `traceparent` headers for distributed tracing
- **Captures Metrics** - Records latency, status codes, request/response sizes
- **Receives OTEL Data** - Exposes `/v1/traces` endpoint for OpenTelemetry push
- **Async DB Writes** - Streams results directly to PostgreSQL without blocking

**Port:** `7000`

[See intercept.prism Developer Docs](./intercept.prism/README.md)

### Data Layer (PostgreSQL + pg_duckdb)

The **"Memory"** of the platform. A hybrid storage solution that combines:

| Storage Type | Use Case | Tables |
|--------------|----------|--------|
| **PostgreSQL (OLTP)** | Transactional data | Users, Workspaces, Collections, Requests |
| **pg_duckdb (OLAP)** | Analytical queries | Executions, Spans (columnar storage) |

This architecture enables sub-second analytical queries (e.g., "P99 latency over the last 24h") without ETL pipelines.

**Port:** `5433`

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Production Deployment

```bash
# Clone the repository
git clone https://github.com/your-org/prism.git
cd prism

# Create the persistent volume for pg_duckdb
make configure

# Build and run all services
make build
```

This will start:
- **soul.prism** at `http://localhost:3000`
- **intercept.prism** at `http://localhost:7000`
- **PostgreSQL (pg_duckdb)** at `localhost:5433`
- **Drizzle Gateway** at `http://localhost:4983`

### Stopping Services

```bash
make down
```

## Development Setup

For development, you can run each service independently:

### 1. Start the Database

```bash
docker compose -f compose.db.yml up -d
```

### 2. Start soul.prism (Frontend)

```bash
cd soul.prism
cp .example.env .env.local  # Configure your environment variables
bun install
make dev
```

### 3. Start intercept.prism (Backend)

```bash
cd intercept.prism
cp .example.env .env  # Configure your environment variables
make dev
```

See the individual service READMEs for detailed setup instructions.

## Project Structure

```
prism/
├── README.md                 # This file
├── Makefile                  # Root-level commands
├── compose.yml               # Production Docker Compose
├── compose.db.yml            # Database services (pg_duckdb + Drizzle Gateway)
├── images/                   # Architecture diagrams and assets
│
├── soul.prism/               # Control Plane (Next.js)
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── backend/          # Server Actions & data layer
│   │   ├── components/       # React components
│   │   └── stores/           # Zustand state management
│   ├── prisma/               # Database schema & migrations
│   └── README.md             # soul.prism developer docs
│
└── intercept.prism/          # Data Plane (Go)
    ├── cmd/                  # Application entrypoint
    ├── internal/
    │   ├── routes/           # HTTP handlers (Gin)
    │   ├── store/            # Async database writes
    │   ├── database/         # Database connections
    │   └── tracing/          # Span/Trace utilities
    ├── model/                # Data models
    ├── docs/                 # Swagger API documentation
    └── README.md             # intercept.prism developer docs
```

## Environment Variables
### soul.prism

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5433/prism` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |
| `CLERK_SIGN_IN_URL` | Sign-in redirect URL | `/sign-in` |
| `CLERK_SIGN_UP_URL` | Sign-up redirect URL | `/sign-up` |

### intercept.prism

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5433/prism?sslmode=disable` |

## Docker Services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `soul.prism` | Custom (Next.js) | 3000 | Frontend application |
| `intercept.prism` | Custom (Go) | 7000 | Proxy/tracing service |
| `db` | pgduckdb/pgduckdb:17-main | 5433 | PostgreSQL with DuckDB extension |
| `drizzle-gate` | drizzle-team/gateway | 4983 | Database management UI |

## Contributing

### Git Workflow

1. **Never push directly to `main`**
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes with clear commits
4. Create a Pull Request

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new tracing visualization
fix: resolve span ordering issue
docs: update API documentation
refactor: simplify request builder logic
```

### Code Quality

- **soul.prism**: Run `bun run lint` and `bun run format` before committing
- **intercept.prism**: Run `gofmt` and `go vet` before committing

### Testing

- **soul.prism**: `make test` (Jest)
- **intercept.prism**: `make test` (Go testing)

## Team

Made with ❤️ by:

| Name | Roll Number |
|------|-------------|
| Akshay | CB.SC.U4CSE23403 |
| Anaswara | CB.SC.U4CSE23405 |
| Ananthu | CB.SC.U4CSE23408 |
| Yash | CB.SC.U4CSE23458 |
| Honnesha | CB.SC.U4CSE23461 |

## License

This project is currently under development and not yet licensed for public use.