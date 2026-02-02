# INTERCEPT.PRISM [WIP]
_Currently a work in progress_


This is the proxy server through which all API requests go through. Currently only handles HTTP requests(REST) with distributed tracing. Future work includes adding support for gRPC, graphQL, websockets and other protocols.

It injects the request with traceID, timestamps the upstream API's response time, captures request metadata(duration, response & response size) and sends it back. It exposes an OTEL endpoint `/v1/traces` so upstream can push OTEL data to the endpoint which then parses it (support for both protobuf and JSON) and stores it in a local store (for now, will shift to DB soon).

### Setup
Make sure to run `make configure` at root `/prism` to make the volume for pg_duckdb.
- Development: Run `make dev`
- Testing: Run `make test`
- Production: Run `make build`
- Generate Docs: Run `make docs`
- Stop: Run `make down`

Docker-Compose files and Makefiles for easy setup and for a seamless dev experience. Includes unit tests for OTEL parsing and the HTTP proxy. Test files are suffixed with `_test.go`. The service runs on port 7000.

### API Documentation
- [Swagger UI](http://localhost:7000/swagger/index.html)

### Remaining Work
- Some code refactoring (especially related to OTEL proto and JSON parsers)
- Additional support for other protocols
- Inject chaos rules into requests