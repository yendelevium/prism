dev:
	docker compose -f ../compose.db.yml up -d
	go build -o intercept.prism cmd/intercept.prism/main.go
	./intercept.prism

build:
	docker compose up --build

down:
	docker compose down
	docker compose  -f ../compose.db.yml down
	docker compose -f ../soul.prism/compose.yml down