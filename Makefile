build:
	docker compose up --build

down:
	docker compose down
	docker compose  -f ./compose.db.yml down
	docker compose  -f ./soul.prism/compose.yml down
	docker compose -f ./intercept.prism/compose.yml down