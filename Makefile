# Conjure monorepo task runner.
# Python lives in packages/conjure, JS in packages/web + apps/landing, docs in apps/docs.
.DEFAULT_GOAL := help
.PHONY: help install test lint fmt docs docs-serve web landing clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Install all dev dependencies (python + js + docs)
	cd packages/conjure && pip install -e ".[dev]"
	pnpm install
	pip install -r apps/docs/requirements.txt

test: ## Run the Python test suite
	cd packages/conjure && pytest

lint: ## Lint python (ruff) + typecheck web (tsc)
	cd packages/conjure && ruff check . && ruff format --check .
	pnpm web:typecheck

fmt: ## Auto-format python
	cd packages/conjure && ruff format . && ruff check --fix .

docs: ## Build the docs site
	cd apps/docs && mkdocs build

docs-serve: ## Live-serve the docs site
	cd apps/docs && mkdocs serve

web: ## Build the React admin web package
	pnpm web:build

landing: ## Build the landing site
	pnpm landing:build

clean: ## Remove build artifacts
	rm -rf packages/web/dist apps/landing/dist apps/docs/site
	find . -name '__pycache__' -type d -prune -exec rm -rf {} +
