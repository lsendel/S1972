# 🚀 Environment Quick Start Guide

## Quick Commands for Each Environment

### Development (dev)
```bash
# Start
make up-dev
# or
make dev

# Stop
make down

# View logs
make logs

# Run tests
make test
```

### Test (test)
```bash
# Start
make up-test

# Stop
make down ENV=test

# Run tests
make test ENV=test
```

### Staging (stage)
```bash
# Setup (first time)
make setup-env ENV=stage
# Edit .env.stage with staging credentials

# Deploy
make deploy-stage

# View logs
make logs ENV=stage

# Stop
make down ENV=stage
```

### Production (prod)
```bash
# Setup (first time)
make setup-env ENV=prod
# Edit .env.prod with production credentials

# Deploy (with confirmation)
make deploy-prod

# View logs
make logs ENV=prod

# Backup database
make db-backup ENV=prod

# Stop
make down ENV=prod
```

## 📊 Environment Comparison

| Feature | Dev | Test | Stage | Prod |
|---------|-----|------|-------|------|
| **Debug Mode** | ✅ On | ❌ Off | ❌ Off | ❌ Off |
| **Hot Reload** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Volume Mounts** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Email** | Mailpit | Console | SMTP | SMTP |
| **Database** | `saas_dev` | `saas_test` | `saas_stage` | `saas_prod` |
| **Redis DB** | 0 | 1 | 2 | 3 |

## 🔧 Common Workflows

### Daily Development
```bash
make dev              # Start
make logs-backend     # Watch backend logs in one terminal
make logs-frontend    # Watch frontend logs in another

# After changes
make test-local
make lint

make stop            # End of day
```

### Before Committing
```bash
make quality         # Run all linters and type checks
make test-all        # Run all tests
```

### Deploying to Staging
```bash
# First time setup
make setup-env ENV=stage
nano .env.stage      # Configure

# Deploy
make deploy-stage

# Verify
make health ENV=stage
make logs ENV=stage
```

### Emergency Production Rollback
```bash
# Backup current state
make db-backup ENV=prod

# Stop services
make down ENV=prod

# Restore from backup
make db-restore ENV=prod FILE=./backups/backup_prod_YYYYMMDD_HHMMSS.sql

# Restart
make up ENV=prod
```

## 🎯 All Available Commands

Run `make help` to see all available commands with descriptions!

```bash
make help
```

## 📁 File Structure

```
saas-boilerplate/
├── docker-compose.yml           # Base configuration
├── docker-compose.dev.yml       # Development overrides
├── docker-compose.test.yml      # Test overrides
├── docker-compose.stage.yml     # Staging overrides
├── docker-compose.prod.yml      # Production overrides
├── .env.example                 # Environment template
├── .env.dev                     # Development config (create with make setup-env ENV=dev)
├── .env.test                    # Test config (create with make setup-env ENV=test)
├── .env.stage                   # Staging config (create with make setup-env ENV=stage)
├── .env.prod                    # Production config (create with make setup-env ENV=prod)
└── Makefile                     # All the commands!
```

## 💡 Pro Tips

1. **Always specify environment for non-dev**
   ```bash
   # ✅ Good
   make up ENV=prod
   make migrate ENV=prod

   # ❌ Bad - will use dev!
   make up ENV=prod
   make migrate
   ```

2. **Use shortcuts**
   ```bash
   make dev              # instead of make up ENV=dev
   make up-test          # instead of make up ENV=test
   make up-stage         # instead of make up ENV=stage
   ```

3. **Check before deploying**
   ```bash
   make quality          # Run all checks
   make test-all         # Run all tests
   ```

4. **Backup before major changes**
   ```bash
   make db-backup ENV=prod
   ```

## 🆘 Help

For detailed documentation, see:
- `make help` - All commands
- [MAKEFILE_GUIDE.md](MAKEFILE_GUIDE.md) - Complete guide with examples
- [CI_CD.md](CI_CD.md) - CI/CD documentation
