ENV_FILE ?= .env

dev: 
	docker compose -f ../compose.db.yml up -d
	bun dev

compose-up:
	docker compose --env-file $(ENV_FILE) up --build

compose-down:
	docker compose down
	docker compose -f ../compose.yml down
	docker compose  -f ../compose.db.yml down
	docker compose -f ../intercept.prism/compose.yml down

docs:
	bun gen-docs

test:
# Don't put `bun test` as it runs bun's internal test runner and thats weird idk why
	bun run test

migrate-up:
# ONLY RUN during dev
# Prisma only has migrate up??
	bunx prisma generate
	bunx prisma migrate dev

format:
	bun format