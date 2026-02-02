dev:
	docker compose -f ../compose.db.yml up -d
	go build -o intercept.prism cmd/intercept.prism/main.go
	./intercept.prism

build:
	docker compose up --build

down:
	docker compose down
	docker compose -f ../compose.yml down
	docker compose  -f ../compose.db.yml down
	docker compose -f ../soul.prism/compose.yml down

test:
	go test ./... -v

docs:
	swag init -g cmd/intercept.prism/main.go -o docs