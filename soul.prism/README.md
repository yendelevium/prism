# SOUL.PRISM [WIP]
_Currently a work in progress_

> **The Control Plane** – A Next.js application serving as the brain of the PRISM platform.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
  - [Frontend Layer](#frontend-layer)
  - [Backend Layer](#backend-layer)
  - [State Management](#state-management)
  - [Database Layer](#database-layer)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Documentation](#documentation)
- [Key Components](#key-components)
- [API Reference](#api-reference)

## Overview

`soul.prism` is the user-facing application of the PRISM platform. It provides:

- **Request Builder UI** – Create, organize, and execute HTTP requests
- **Collection Management** – Group requests into collections within workspaces
- **Distributed Tracing Visualization** – View request traces and span hierarchies
- **Analytics Dashboard** – Monitor P99 latency, success rates, and trends
- **Multi-Tenant Workspaces** – Team collaboration with role-based access

It communicates with `intercept.prism` to proxy API requests and receive tracing data.

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Runtime** | [Bun](https://bun.sh/) |
| **Language** | TypeScript |
| **UI** | React 19, Tailwind CSS 4 |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Data Fetching** | [TanStack Query](https://tanstack.com/query) |
| **Authentication** | [Clerk](https://clerk.com/) |
| **Database ORM** | [Prisma](https://www.prisma.io/) |
| **Code Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Tracing Visualization** | [React Flow](https://reactflow.dev/) |
| **Linting/Formatting** | [Biome](https://biomejs.dev/) |
| **Testing** | [Jest](https://jestjs.io/) + React Testing Library |
| **Documentation** | [TypeDoc](https://typedoc.org/) |

## Getting Started

### Prerequisites

- **Bun** v1.0+ ([Install Bun](https://bun.sh/))
- **PostgreSQL** with pg_duckdb extension (via Docker)
- **Clerk Account** for authentication keys

### Installation

```bash
# Navigate to the soul.prism directory
cd soul.prism

# Install dependencies
bun install

# Set up environment variables
cp .example.env .env.local
# Edit .env.local with your configuration
```

### Database Setup

```bash
# Generate Prisma client
bunx prisma generate

# Push schema to database (development)
bunx prisma db push

# Or run migrations (production)
bunx prisma migrate deploy
```

### Running the Application

```bash
# Development mode (with hot reload)
make dev

# Production build
make build

# Start production server
bun run start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
soul.prism/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Landing page
│   │   ├── globals.css           # Global styles
│   │   ├── analytics/            # Analytics dashboard
│   │   ├── dashboard/            # Main application dashboard
│   │   ├── sign-in/              # Clerk sign-in page
│   │   ├── sign-up/              # Clerk sign-up page
│   │   └── providers/            # React context providers
│   │
│   ├── backend/                  # Server Actions & data access
│   │   ├── index.ts              # Barrel exports
│   │   ├── auth/                 # Authentication actions
│   │   ├── workspace/            # Workspace CRUD operations
│   │   ├── collection/           # Collection CRUD operations
│   │   ├── request/              # Request CRUD operations
│   │   └── execution/            # Execution history queries
│   │
│   ├── components/               # React components
│   │   ├── sidebar/              # Navigation sidebar
│   │   ├── topbar/               # Top navigation bar
│   │   ├── requestbar/           # Request method/URL bar
│   │   ├── editors/              # Monaco-based editors
│   │   ├── request/              # Request builder components
│   │   ├── response/             # Response viewer components
│   │   ├── bottompanel/          # Tabs panel (params, body, etc.)
│   │   ├── common/               # Shared UI components
│   │   ├── context/              # Context providers
│   │   └── toast/                # Toast notifications
│   │
│   ├── stores/                   # Zustand state stores
│   │   ├── useRequestStore.ts    # Current request state
│   │   ├── useSelectionStore.ts  # UI selection state
│   │   └── useWorkspaceStore.ts  # Active workspace state
│   │
│   ├── utils/                    # Utility functions
│   ├── @types/                   # TypeScript type definitions
│   └── middleware.ts             # Next.js middleware (auth)
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
│
├── public/
│   ├── docs/                     # Generated TypeDoc documentation
│   └── ...                       # Static assets
│
├── Dockerfile                    # Docker configuration
├── Makefile                      # Development commands
├── package.json                  # Dependencies and scripts
├── biome.json                    # Linting configuration
├── tsconfig.json                 # TypeScript configuration
├── typedoc.json                  # TypeDoc configuration
└── jest.config.js                # Jest configuration
```

## Architecture

### Frontend Layer

The UI is built with React 19 and organized into feature-based components:

### Backend Layer

Server-side logic uses Next.js **Server Actions** for data mutations:

```typescript
// src/backend/workspace/actions.ts
'use server'

export async function createWorkspace(data: CreateWorkspaceInput) {
  // Validates with Clerk, writes to Prisma
}
```

### State Management

Global state is managed with Zustand stores:

| Store | Purpose |
|-------|---------|
| `useRequestStore` | Current request being edited (method, URL, headers, body) |
| `useSelectionStore` | Selected collection/request in sidebar |
| `useWorkspaceStore` | Active workspace context |

### Database Layer

Prisma ORM connects to PostgreSQL with the following models:

```
User ─────┬────── UserWorkspace ─────── Workspace
          │                               ├── Collection ─── Request ─── Execution
          │                               └── Environment
          └── Collection
               └── Request

Span (Tracing data - stored in pg_duckdb columnar format)
```

## Environment Variables

Create a `.env.local` file based on `.example.env`:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5433/prism

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up
CLERK_AFTER_SIGN_IN_URL=/dashboard
CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Getting Clerk Keys

1. Create a Clerk application at [clerk.com](https://clerk.com/)
2. Navigate to **API Keys** in your Clerk dashboard
3. Copy the publishable and secret keys

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `make dev` | Start development server with hot reload |
| `make build` | Create production build |
| `make test` | Run Jest test suite |
| `make docs` | Generate TypeDoc documentation |
| `bun run lint` | Run Biome linter |
| `bun run format` | Format code with Biome |
| `bunx prisma studio` | Open Prisma database GUI |

## Testing

### Running Tests

```bash
# Run all tests
make test

# Run tests in watch mode
bun run test:watch

# Run specific test file
bun run test -- src/components/sidebar/Sidebar.test.tsx
```

### Writing Tests

Tests are colocated with components or placed in `__tests__` directories:

```typescript
// src/components/sidebar/Sidebar.test.tsx
import { render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders collections list', () => {
    render(<Sidebar collections={mockCollections} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
```

### Mocking Browser APIs

Browser APIs that need mocking are defined in `jest.setup.js`:

```javascript
// jest.setup.js
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    // ...
  })),
});
```

## Documentation

### Generating Docs

```bash
make docs
```

Documentation is generated to `public/docs/` and can be viewed at `/docs/index.html` when the server is running.

### Writing Doc Comments

Use JSDoc/TSDoc comments for TypeDoc to pick up:

```typescript
/**
 * Creates a new request in the specified collection.
 * 
 * @param collectionId - The ID of the parent collection
 * @param data - Request configuration (method, URL, headers, body)
 * @returns The created request object
 * 
 * @example
 * ```ts
 * const request = await createRequest('col_123', {
 *   name: 'Get Users',
 *   method: 'GET',
 *   url: 'https://api.example.com/users'
 * });
 * ```
 */
export async function createRequest(
  collectionId: string,
  data: CreateRequestInput
): Promise<Request> {
  // ...
}
```

## Key Components

### Request Builder

The main interface for constructing HTTP requests:

| Component | Location | Description |
|-----------|----------|-------------|
| `Requestbar` | `components/requestbar/` | Method selector + URL input + Send button |
| `BottomPanel` | `components/bottompanel/` | Tabs for Params, Headers, Body, Auth |
| `JsonEditor` | `components/editors/` | Monaco-based JSON body editor |
| `ResponseViewer` | `components/response/` | Displays response body, headers, timing |

### Tracing Visualization

Displays distributed traces as a flame graph or timeline:

| Component | Location | Description |
|-----------|----------|-------------|
| `TracePanel` | `components/bottompanel/` | Trace ID display and span list |
| `SpanTree` | `components/bottompanel/` | Hierarchical span visualization |

### Analytics Dashboard

Located at `/analytics`, displays:

- Request latency percentiles (P50, P95, P99)
- Success/failure rates over time
- Most frequent endpoints
- Response time distributions

## API Reference

soul.prism communicates with intercept.prism's REST API:

### Execute Request

```http
POST http://localhost:7000/rest/
Content-Type: application/json

{
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": {
    "Authorization": "Bearer token"
  },
  "body": "",
  "collectionId": "col_123",
  "createdById": "user_456"
}
```

### Response

```json
{
  "statusCode": 200,
  "body": "{\"users\": [...]}",
  "headers": { "Content-Type": "application/json" },
  "duration": "125ms",
  "traceId": "abc123...",
  "spanId": "def456...",
  "spans": [{ ... }]
}
```

See the [intercept.prism API documentation](http://localhost:7000/swagger/index.html) for complete API reference.

## Troubleshooting

### Common Issues

**Prisma client not generated:**
```bash
bunx prisma generate
```

**Database connection failed:**
- Ensure pg_duckdb container is running: `docker ps`
- Check `DATABASE_URL` in `.env.local`

**Clerk authentication errors:**
- Verify Clerk keys are correct
- Check Clerk dashboard for allowed origins

**Monaco Editor not loading:**
- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `bun install`