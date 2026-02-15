compose-up:
	docker compose up --build

compose-down:
	docker compose down
	docker compose  -f ./compose.db.yml down
	docker compose  -f ./soul.prism/compose.yml down
	docker compose -f ./intercept.prism/compose.yml down

configure:
# 	docker volume create pg_duckdb_data
# 	Install lefthook
	go install github.com/evilmartians/lefthook/v2@v2.1.1
	lefthook install

# In a Makefile, .PHONY is a special built-in target used to tell Make that a specific target name is not a file.
# By default, Make assumes every target (the word before the colon :) is the name of a file you want to create. .PHONY overrides this behavior.
.PHONY: test

# Runs tests in both directories sequentially
test:
	$(MAKE) -C soul.prism test
	$(MAKE) -C intercept.prism test

clean:
	$(MAKE) compose-down
	docker volume rm pg_duckdb_data
	lefthook uninstall

