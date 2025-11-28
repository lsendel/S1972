# Makefile Guide - Multi-Environment Support

This guide explains how to use the enhanced Makefile to manage your SaaS application across different environments.

## 🌍 Environments

The Makefile supports four environments:

- **dev** (development) - Default environment for local development
- **test** - Testing environment for running automated tests
- **stage** (staging) - Production-like environment for pre-production testing
- **prod** (production) - Production environment

## 🚀 Quick Start

### View All Available Commands

```bash
make help
# or simply
make
```

### Start Development Environment

```bash
# Method 1: Using default (dev)
make up

# Method 2: Explicitly specify dev
make up ENV=dev

# Method 3: Quick shortcut
make dev
```

### Start Other Environments

```bash
# Start test environment
make up ENV=test
# or
make up-test

# Start staging environment
make up ENV=stage
# or
make up-stage

# Start production environment
make up ENV=prod
# or
make up-prod
```

## 📋 Common Commands by Category

### Environment Management

```bash
# Start services
make up                    # Start dev (default)
make up ENV=test          # Start test environment
make up-stage             # Start staging
make up-prod              # Start production

# Stop services
make down                 # Stop current environment
make down-all             # Stop and remove volumes

# Restart services
make restart              # Restart all services
make restart-backend      # Restart only backend
make restart-frontend     # Restart only frontend

# Build containers
make build                # Build for dev
make build ENV=stage      # Build for staging
make build-nocache        # Build without cache

# View logs
make logs                 # All services
make logs-backend         # Backend only
make logs-frontend        # Frontend only
make logs-celery          # Celery only

# Check status
make ps                   # Show running containers
make status               # Alias for ps
make health               # Check service health
```

### Database Operations

```bash
# Migrations
make migrate              # Run migrations
make makemigrations       # Create new migrations
make migrate-status       # Show migration status

# Database access
make db-shell             # Open PostgreSQL shell

# Backup & Restore
make db-backup            # Backup current database
make db-backup ENV=prod   # Backup production database

make db-restore FILE=./backups/backup_dev_20241128_120000.sql
```

### Backend Development

```bash
# Django shell
make shell                # Django shell
make shell-plus           # Django shell_plus (if installed)

# User management
make createsuperuser      # Create admin user

# Static files
make collectstatic        # Collect static files (for prod/stage)
```

### Testing

```bash
# Backend tests
make test                 # Run backend tests in Docker
make test-local           # Run backend tests locally
make test-coverage        # Run with coverage report

# Frontend tests
make test-frontend        # Run frontend tests in Docker
make test-frontend-local  # Run frontend tests locally
make test-e2e             # Run E2E tests

# All tests
make test-all             # Run all tests (backend + frontend)
```

### Code Quality

```bash
# Backend
make lint                 # Lint backend code
make lint-fix             # Lint and auto-fix
make format               # Format backend code
make typecheck            # Type check with mypy

# Frontend
make frontend-lint        # Lint frontend code
make frontend-lint-fix    # Lint and auto-fix
make frontend-typecheck   # Type check with TypeScript

# All quality checks
make quality              # Run all linting and type checking
```

### Setup & Installation

```bash
# Initial setup
make setup                # Complete dev environment setup

# Install dependencies
make dev-install          # Install backend dev dependencies
make frontend-install     # Install frontend dependencies

# Environment files
make setup-env ENV=dev    # Create .env.dev
make setup-env ENV=stage  # Create .env.stage
make setup-env ENV=prod   # Create .env.prod
```

### Cleanup

```bash
# Clean cache
make clean                # Remove Python cache files

# Deep clean
make clean-all            # Remove all generated files and containers
```

### Utilities

```bash
# Seed data
make seed                 # Seed database with sample data

# Flush database
make flush                # Delete all data (with confirmation)

# Execute custom commands
make exec-backend CMD="python manage.py check"
make exec-frontend CMD="npm run build"
```

## 🔄 Deployment

### Staging Deployment

```bash
make deploy-stage
```

This will:
1. Build images for staging
2. Start staging services
3. Run migrations
4. Collect static files

### Production Deployment

```bash
make deploy-prod
```

This will:
1. Ask for confirmation (safety check)
2. Build images for production
3. Start production services
4. Run migrations
5. Collect static files

## 📚 Usage Examples

### Example 1: New Developer Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd saas-boilerplate

# 2. Run setup
make setup

# 3. Create superuser
make createsuperuser

# 4. Access application
# Frontend: http://localhost
# Backend: http://api.localhost
# Admin: http://api.localhost/admin
```

### Example 2: Daily Development Workflow

```bash
# Start your day
make dev                  # Start development environment
make logs                 # Watch logs

# Make changes...

# Run quality checks
make lint                 # Lint backend
make frontend-lint        # Lint frontend

# Run tests
make test-local           # Backend tests
make test-frontend-local  # Frontend tests

# Create migration
make makemigrations
make migrate

# End of day
make down                 # Stop services
```

### Example 3: Testing Before PR

```bash
# Start test environment
make up-test

# Run all tests
make test-all

# Run quality checks
make quality

# Stop test environment
make down ENV=test
```

### Example 4: Staging Deployment

```bash
# Create staging environment file
make setup-env ENV=stage

# Edit .env.stage with staging configuration
nano .env.stage

# Deploy to staging
make deploy-stage

# Check logs
make logs ENV=stage

# Verify deployment
make health ENV=stage
```

### Example 5: Database Backup

```bash
# Backup development database
make db-backup

# Backup production database
make db-backup ENV=prod

# List backups
ls -lh ./backups/

# Restore from backup
make db-restore FILE=./backups/backup_prod_20241128_120000.sql
```

## 🎯 Environment Variables

Each environment can have its own `.env` file:

- `.env` - Development (default)
- `.env.test` - Testing
- `.env.stage` - Staging
- `.env.prod` - Production

Create environment-specific files:

```bash
make setup-env ENV=test
make setup-env ENV=stage
make setup-env ENV=prod
```

## 🐳 Docker Compose Files

The Makefile uses layered Docker Compose configuration:

- `docker-compose.yml` - Base configuration (shared)
- `docker-compose.dev.yml` - Development overrides
- `docker-compose.test.yml` - Test overrides
- `docker-compose.stage.yml` - Staging overrides
- `docker-compose.prod.yml` - Production overrides

When you run `make up ENV=stage`, it combines:
```bash
docker-compose -f docker-compose.yml -f docker-compose.stage.yml up -d
```

## 💡 Pro Tips

1. **Default to Dev**: If you don't specify `ENV`, it defaults to `dev`
   ```bash
   make up        # Same as: make up ENV=dev
   make test      # Same as: make test ENV=dev
   ```

2. **Quick Commands**: Use shortcuts for common tasks
   ```bash
   make dev       # Quick start development
   make stop      # Quick stop
   make status    # Quick status check
   ```

3. **Watch Logs**: Keep logs running in a separate terminal
   ```bash
   make logs      # Follow all logs
   make logs-backend  # Only backend logs
   ```

4. **Test Before Commit**: Always run quality checks
   ```bash
   make quality   # Run all linting and type checks
   make test-all  # Run all tests
   ```

5. **Backup Before Major Changes**
   ```bash
   make db-backup
   # Make changes...
   # If something goes wrong:
   make db-restore FILE=./backups/backup_dev_YYYYMMDD_HHMMSS.sql
   ```

6. **Use Environment-Specific Commands**
   ```bash
   # Wrong: Mixing environments
   make up ENV=prod
   make migrate  # This will migrate dev, not prod!

   # Right: Consistent environment
   make up ENV=prod
   make migrate ENV=prod
   ```

## 🔍 Troubleshooting

### Services won't start

```bash
# Check status
make ps

# View logs
make logs

# Rebuild without cache
make down
make build-nocache
make up
```

### Database issues

```bash
# Check database connection
make db-shell

# View migration status
make migrate-status

# Reset database (development only!)
make flush
make migrate
```

### Port conflicts

If ports are already in use:

```bash
# Stop all Docker containers
docker stop $(docker ps -aq)

# Or change ports in docker-compose.yml
```

## 📖 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Django Documentation](https://docs.djangoproject.com/)
- [CI/CD Guide](CI_CD.md)
- [Deployment Runbook](DEPLOYMENT_RUNBOOK.md)

## 🆘 Getting Help

```bash
# View all commands with descriptions
make help

# View specific command details
make help | grep migrate
```

For issues or questions, check the project documentation or create an issue in the repository.
