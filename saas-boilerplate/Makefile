.PHONY: help build up down logs shell migrate makemigrations test test-local lint format typecheck dev-install frontend-lint frontend-test frontend-build setup clean
.DEFAULT_GOAL := help

# Environment configuration
ENV ?= dev
COMPOSE_FILE := docker-compose.yml
COMPOSE_ENV_FILE := docker-compose.$(ENV).yml

# Check if environment-specific file exists, otherwise use base
ifneq ("$(wildcard $(COMPOSE_ENV_FILE))","")
	DOCKER_COMPOSE := docker-compose -f $(COMPOSE_FILE) -f $(COMPOSE_ENV_FILE)
else
	DOCKER_COMPOSE := docker-compose -f $(COMPOSE_FILE)
endif

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help
	@echo "$(BLUE)SaaS Boilerplate - Make Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Usage:$(NC)"
	@echo "  make [command] [ENV=<env>]"
	@echo ""
	@echo "$(GREEN)Environments:$(NC)"
	@echo "  dev   - Development (default)"
	@echo "  test  - Testing"
	@echo "  stage - Staging"
	@echo "  prod  - Production"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Environment Management

up: ## Start all services (use ENV=dev|test|stage|prod)
	@echo "$(GREEN)Starting environment: $(ENV)$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Services started!$(NC)"

up-dev: ## Start development environment
	@$(MAKE) up ENV=dev

up-test: ## Start test environment
	@$(MAKE) up ENV=test

up-stage: ## Start staging environment
	@$(MAKE) up ENV=stage

up-prod: ## Start production environment
	@$(MAKE) up ENV=prod

down: ## Stop all services
	@echo "$(YELLOW)Stopping environment: $(ENV)$(NC)"
	$(DOCKER_COMPOSE) down

down-all: ## Stop and remove all volumes
	@echo "$(RED)Stopping environment and removing volumes: $(ENV)$(NC)"
	$(DOCKER_COMPOSE) down -v

restart: ## Restart all services
	@$(MAKE) down
	@$(MAKE) up

build: ## Build Docker images (use ENV=dev|test|stage|prod)
	@echo "$(GREEN)Building images for: $(ENV)$(NC)"
	$(DOCKER_COMPOSE) build

build-nocache: ## Build Docker images without cache
	@echo "$(GREEN)Building images without cache for: $(ENV)$(NC)"
	$(DOCKER_COMPOSE) build --no-cache

logs: ## Tail logs for all services
	$(DOCKER_COMPOSE) logs -f

logs-backend: ## Tail backend logs
	$(DOCKER_COMPOSE) logs -f backend

logs-frontend: ## Tail frontend logs
	$(DOCKER_COMPOSE) logs -f frontend

logs-celery: ## Tail celery logs
	$(DOCKER_COMPOSE) logs -f celery

ps: ## Show running containers
	$(DOCKER_COMPOSE) ps

##@ Database

migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(NC)"
	$(DOCKER_COMPOSE) exec backend python manage.py migrate

makemigrations: ## Create new migrations
	@echo "$(GREEN)Creating migrations...$(NC)"
	$(DOCKER_COMPOSE) exec backend python manage.py makemigrations

migrate-status: ## Show migration status
	$(DOCKER_COMPOSE) exec backend python manage.py showmigrations

db-shell: ## Open database shell
	$(DOCKER_COMPOSE) exec db psql -U postgres

db-backup: ## Backup database
	@echo "$(GREEN)Backing up database...$(NC)"
	@mkdir -p ./backups
	$(DOCKER_COMPOSE) exec -T db pg_dump -U postgres saas_$(ENV) > ./backups/backup_$(ENV)_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup complete!$(NC)"

db-restore: ## Restore database from backup (use FILE=path/to/backup.sql)
	@if [ -z "$(FILE)" ]; then echo "$(RED)Error: Please specify FILE=path/to/backup.sql$(NC)"; exit 1; fi
	@echo "$(YELLOW)Restoring database from $(FILE)...$(NC)"
	$(DOCKER_COMPOSE) exec -T db psql -U postgres saas_$(ENV) < $(FILE)
	@echo "$(GREEN)Restore complete!$(NC)"

##@ Backend Development

shell: ## Open Django shell
	$(DOCKER_COMPOSE) exec backend python manage.py shell

shell-plus: ## Open Django shell_plus (if available)
	$(DOCKER_COMPOSE) exec backend python manage.py shell_plus

createsuperuser: ## Create Django superuser
	$(DOCKER_COMPOSE) exec backend python manage.py createsuperuser

collectstatic: ## Collect static files
	$(DOCKER_COMPOSE) exec backend python manage.py collectstatic --noinput

##@ Testing

test: ## Run backend tests
	@echo "$(GREEN)Running backend tests...$(NC)"
	$(DOCKER_COMPOSE) exec backend pytest

test-coverage: ## Run backend tests with coverage
	@echo "$(GREEN)Running backend tests with coverage...$(NC)"
	$(DOCKER_COMPOSE) exec backend pytest --cov=apps --cov-report=html --cov-report=term

test-local: ## Run backend tests locally (without Docker)
	@echo "$(GREEN)Running backend tests locally...$(NC)"
	cd backend && pytest

test-frontend: ## Run frontend tests in Docker
	@echo "$(GREEN)Running frontend tests...$(NC)"
	$(DOCKER_COMPOSE) exec frontend npm test

test-frontend-local: ## Run frontend tests locally
	@echo "$(GREEN)Running frontend tests locally...$(NC)"
	cd frontend && npm test

test-e2e: ## Run end-to-end tests
	@echo "$(GREEN)Running E2E tests...$(NC)"
	cd frontend && npm run test:e2e

test-all: ## Run all tests (backend + frontend)
	@$(MAKE) test
	@$(MAKE) test-frontend-local

##@ Code Quality

lint: ## Lint backend code
	@echo "$(GREEN)Linting backend...$(NC)"
	cd backend && python -m ruff check .

lint-fix: ## Lint and fix backend code
	@echo "$(GREEN)Linting and fixing backend...$(NC)"
	cd backend && python -m ruff check . --fix

format: ## Format backend code
	@echo "$(GREEN)Formatting backend...$(NC)"
	cd backend && python -m ruff format .

typecheck: ## Type check backend code
	@echo "$(GREEN)Type checking backend...$(NC)"
	cd backend && python -m mypy apps config

frontend-lint: ## Lint frontend code
	@echo "$(GREEN)Linting frontend...$(NC)"
	cd frontend && npm run lint

frontend-lint-fix: ## Lint and fix frontend code
	@echo "$(GREEN)Linting and fixing frontend...$(NC)"
	cd frontend && npm run lint -- --fix

frontend-typecheck: ## Type check frontend code
	@echo "$(GREEN)Type checking frontend...$(NC)"
	cd frontend && npx tsc --noEmit

quality: ## Run all quality checks
	@$(MAKE) lint
	@$(MAKE) typecheck
	@$(MAKE) frontend-lint
	@$(MAKE) frontend-typecheck

##@ Frontend Development

frontend-build: ## Build frontend for production
	@echo "$(GREEN)Building frontend...$(NC)"
	cd frontend && npm run build

frontend-dev: ## Run frontend in development mode
	cd frontend && npm run dev

frontend-install: ## Install frontend dependencies
	cd frontend && npm ci

##@ Setup & Installation

dev-install: ## Install backend development dependencies locally
	@echo "$(GREEN)Installing backend dev dependencies...$(NC)"
	cd backend && pip install -e ".[dev]"

setup: ## Initial project setup (development)
	@echo "$(GREEN)Setting up development environment...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env from .env.example...$(NC)"; \
		cp .env.example .env; \
		echo "$(YELLOW)Please update .env with your configuration$(NC)"; \
	fi
	@echo "$(GREEN)Building containers...$(NC)"
	@$(MAKE) build ENV=dev
	@echo "$(GREEN)Starting services...$(NC)"
	@$(MAKE) up ENV=dev
	@echo "$(YELLOW)Waiting for database...$(NC)"
	@sleep 5
	@echo "$(GREEN)Running migrations...$(NC)"
	@$(MAKE) migrate ENV=dev
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo ""
	@echo "$(BLUE)Access your application:$(NC)"
	@echo "  Frontend: http://localhost"
	@echo "  Backend API: http://api.localhost"
	@echo "  Admin: http://api.localhost/admin"
	@echo "  Mailpit: http://mail.localhost"
	@echo "  Traefik Dashboard: http://localhost:8080"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Update .env with your configuration"
	@echo "  2. Create a superuser: make createsuperuser"
	@echo "  3. Start coding!"

setup-env: ## Create environment-specific .env file (use ENV=dev|test|stage|prod)
	@if [ ! -f .env.$(ENV) ]; then \
		echo "$(YELLOW)Creating .env.$(ENV) from .env.example...$(NC)"; \
		cp .env.example .env.$(ENV); \
		echo "$(GREEN).env.$(ENV) created$(NC)"; \
		echo "$(YELLOW)Please update with $(ENV) configuration$(NC)"; \
	else \
		echo "$(YELLOW).env.$(ENV) already exists$(NC)"; \
	fi

##@ Cleanup

clean: ## Remove Python cache files
	@echo "$(YELLOW)Cleaning Python cache files...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo "$(GREEN)Clean complete!$(NC)"

clean-all: ## Remove all generated files and containers
	@$(MAKE) clean
	@$(MAKE) down-all
	rm -rf ./backups
	@echo "$(GREEN)Deep clean complete!$(NC)"

##@ Utilities

seed: ## Seed database with sample data
	@echo "$(GREEN)Seeding database...$(NC)"
	$(DOCKER_COMPOSE) exec backend python manage.py seed

flush: ## Flush database (WARNING: deletes all data)
	@echo "$(RED)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(DOCKER_COMPOSE) exec backend python manage.py flush --noinput; \
		echo "$(GREEN)Database flushed$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

exec-backend: ## Execute command in backend container (use CMD="command")
	$(DOCKER_COMPOSE) exec backend $(CMD)

exec-frontend: ## Execute command in frontend container (use CMD="command")
	$(DOCKER_COMPOSE) exec frontend $(CMD)

health: ## Check health of all services
	@echo "$(GREEN)Checking service health...$(NC)"
	@$(DOCKER_COMPOSE) ps

##@ Production Deployment

deploy-stage: ## Deploy to staging
	@echo "$(YELLOW)Deploying to staging...$(NC)"
	@$(MAKE) build ENV=stage
	@$(MAKE) up ENV=stage
	@$(MAKE) migrate ENV=stage
	@$(MAKE) collectstatic ENV=stage
	@echo "$(GREEN)Staging deployment complete!$(NC)"

deploy-prod: ## Deploy to production (use with caution!)
	@echo "$(RED)WARNING: Deploying to PRODUCTION!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(MAKE) build ENV=prod; \
		$(MAKE) up ENV=prod; \
		$(MAKE) migrate ENV=prod; \
		$(MAKE) collectstatic ENV=prod; \
		echo "$(GREEN)Production deployment complete!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

##@ Quick Commands

dev: up-dev ## Quick start development (alias for up-dev)

stop: down ## Quick stop (alias for down)

restart-backend: ## Restart backend service
	$(DOCKER_COMPOSE) restart backend

restart-frontend: ## Restart frontend service
	$(DOCKER_COMPOSE) restart frontend

status: ps ## Show status (alias for ps)
