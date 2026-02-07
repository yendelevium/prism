# PRISM [WIP]
_Currently a work-in-progress_

A unified platform for API testing, distributed tracing, chaos injection, test automation and analytics. This, is PRISM.

## Setup
To run the application, 
- Run `make configure`
- Production - `make build`

Or if you want to play around with the individual services (soul.prism and intercept.prism) you can find their setup details in their respective folders. 

## Architecture Diagram
![Prism Architecture](images/prism_architecture.png)

The Prism platform follows a Control Plane / Data Plane separation pattern, designed to handle high-throughput API testing without compromising user interface responsiveness.

### The Control Plane (soul.prism)
The "Brain." It handles user interaction, authentication, test scheduling, and data visualization. It does not execute HTTP tests. Instead, it dispatches execution commands to the Data Plane. It also reads aggregated analytics from PostgreSQL to render charts and dashboards.

### The Data Plane (intercept.prism)
The "Muscle." A high-performance, asynchronous execution engine built with Go to manage thousands of concurrent connections with minimal thread overhead. It intercepts execution commands, injects observability headers (Trace-IDs, Timestamps), executes the HTTP request to the target (e.g., Google, internal microservices), captures the raw response (Headers, Body, Status, Duration) and asynchronously streams result data directly to the database, bypassing the UI to reduce latency.

### The Unified Data Layer (PostgreSQL + pg_duckdb)
The "Memory." A hybrid storage solution. Standard PostgreSQL tables store User Profiles, Collection Configs, and Auth data. The pg_duckdb extension allows us to store millions of execution logs in columnar format within the same Postgres instance, enabling sub-second analytical queries (e.g., "P99 Latency over the last 24h") without ETL pipelines.

<!-- ### Testing -->
<!-- TODO: Write this and make Makefile for test -->

<!-- Maybe add this in a Codeowners file? smtg with .github idk -->
## The Team
Made with <3
- Akshay (CB.SC.U4CSE23403)
- Anaswara (CB.SC.U4CSE23405)
- Ananthu (CB.SC.U4CSE23408)
- Yash (CB.SC.U4CSE23458)
- Honnesha (CB.SC.U4CSE23461)

## Contributing
For any new feature, checkout a new git branch, add your changes there, and create a PR to merge it into main. NEVER PUSH DIRECTLY TO MAIN. 

Follow [Git hygiene](https://cbea.ms/git-commit/), and [Commit Convetions](https://medium.com/@aslandjc7/git-is-a-powerful-version-control-system-but-writing-clear-and-meaningful-commit-messages-is-48eebc428a00)