.PHONY: dev desktop gateway migrate-sqlite migrate-gateway test clean help

help: ## Show this help
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: desktop ## Run desktop app in dev mode (default)

desktop: ## Run Tauri desktop app in development mode
	cd apps/desktop && pnpm install && pnpm tauri dev

gateway: ## Run gateway service
	cargo run -p gateway

test: ## Run all workspace tests
	cargo test --workspace

clippy: ## Run clippy linter
	cargo clippy --workspace --all-targets -- -D warnings

fmt: ## Format all Rust code
	cargo fmt --all

migrate-sqlite: ## Create and run SQLite migrations
	@echo "Creating SQLite database..."
	@if not exist app.db (sqlx database create --database-url sqlite://app.db)
	sqlx migrate run --source migrations/sqlite --database-url sqlite://app.db

migrate-gateway: ## Create and run Postgres migrations for gateway
	sqlx database create --database-url $(DATABASE_URL) || echo "Database already exists"
	sqlx migrate run --source migrations/gateway_postgres --database-url $(DATABASE_URL)

clean: ## Clean build artifacts
	cargo clean
	cd apps/desktop && rd /s /q node_modules dist 2>nul || echo "Already clean"

build-desktop: ## Build desktop app for production
	cd apps/desktop && pnpm install && pnpm tauri build

build-gateway: ## Build gateway service for production
	cargo build --release -p gateway
