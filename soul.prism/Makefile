dev: 
	docker compose -f ../compose.db.yml up -d
	bun next dev

compose-up:
	docker compose up --build

compose-down:
	docker compose down
	docker compose -f ../compose.yml down
	docker compose  -f ../compose.db.yml down
	docker compose -f ../intercept.prism/compose.yml down

docs:
	bun run gen-docs

test:
	bun run test

migrate-up:
# ONLY RUN during dev
# Prisma only has migrate up??
	npx prisma migrate dev