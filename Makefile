ENV_FILE ?= soul.prism/.env
# Only pass --env-file if the file exists (CI relies on shell env vars instead)
COMPOSE_ENV_FILE := $(if $(wildcard $(ENV_FILE)),--env-file $(ENV_FILE),)

build:
# 	Just checks if the images are built
#   Will be useful as a PR build check so we can fail fast
	docker compose $(COMPOSE_ENV_FILE) build

compose-up:
	docker compose $(COMPOSE_ENV_FILE) up --build

compose-down:
	docker compose down
	docker compose  -f ./compose.db.yml down
	docker compose  -f ./soul.prism/compose.yml down
	docker compose -f ./intercept.prism/compose.yml down

configure:
	docker volume create pg_duckdb_data
# 	Install lefthook
	go install github.com/evilmartians/lefthook/v2@v2.1.1
	lefthook install
	$(MAKE) -C soul.prism migrate-up

# In a Makefile, .PHONY is a special built-in target used to tell Make that a specific target name is not a file.
# By default, Make assumes every target (the word before the colon :) is the name of a file you want to create. .PHONY overrides this behavior.
.PHONY: test

# Runs tests in both directories sequentially
test:
	$(MAKE) -C soul.prism test
	$(MAKE) -C intercept.prism test

format:
	$(MAKE) -C soul.prism format
	$(MAKE) -C intercept.prism format

clean:
	$(MAKE) compose-down
	docker volume rm pg_duckdb_data
	lefthook uninstall

