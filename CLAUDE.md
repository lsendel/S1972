# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Django + React SaaS boilerplate with multi-tenancy (organizations), subscriptions (Stripe integration), and authentication. The project uses Docker Compose with Traefik as a reverse proxy.

**Architecture:** Monorepo containing separate backend (Django REST Framework) and frontend (React + Vite + TypeScript) applications in the `saas-boilerplate/` directory.

## Development Commands

All commands should be run from the `saas-boilerplate/` directory.

### Docker Container Management

```bash
# Start all services (Traefik, backend, frontend, db, redis, celery, mailpit)
make up

# Stop all services
make down

# Rebuild containers
make build

# View logs
make logs
```

### Backend (Django)

```bash
# Run database migrations
make migrate

# Create new migrations after model changes
make makemigrations

# Django shell
make shell

# Run tests
make test

# Seed database with test data
make seed
```

**Direct management commands** (when containers are running):
```bash
docker-compose exec backend python manage.py <command>
```

### Frontend (React + Vite)

From `saas-boilerplate/frontend/`:
```bash
# Development server (runs inside Docker, or locally)
npm run dev

# Type check and build
npm run build

# Lint TypeScript/TSX files
npm run lint

# Preview production build
npm run preview
```

## Service URLs (Local Development)

- **Frontend:** http://localhost (via Traefik)
- **Backend API:** http://localhost/api/v1 (via Traefik)
- **Django Admin:** http://localhost/admin
- **API Documentation:** http://localhost/api/docs/ (Swagger UI)
- **Traefik Dashboard:** http://localhost:8080
- **Mailpit UI:** http://localhost:8025 (email testing)

## Architecture & Key Concepts

### Backend Structure

**Settings:** Django uses split settings in `backend/config/settings/`:
- `base.py` - Shared configuration
- `development.py` - Local development (extends base)
- `production.py` - Production settings (extends base)

Settings module is configured via `DJANGO_SETTINGS_MODULE` environment variable.

**Apps:**
- `accounts` - Custom User model (email-based authentication, UUIDs)
- `authentication` - Auth endpoints (login, signup, session management)
- `organizations` - Multi-tenancy with Organization, Membership, and Invitation models
- `subscriptions` - Stripe-integrated subscription management with Plan and Subscription models
- `core` - Shared utilities and base models

**Key Models:**
- User: UUID primary key, email-based auth, TOTP support, JSONB preferences
- Organization: Multi-tenant entity with Stripe customer ID, slug-based routing
- Membership: Links users to organizations with roles (owner/admin/member)
- Subscription: One-to-one with Organization, tracks Stripe subscription state
- Plan: Subscription tier definition with monthly/yearly pricing

**Background Tasks:** Celery workers and Celery Beat scheduler for async tasks (e.g., webhooks, emails, periodic jobs).

### Frontend Structure

**State Management:**
- React Query (`@tanstack/react-query`) - Server state, API caching
- Zustand (`stores/`) - Client state (UI preferences)

**Routing:** React Router v6 with protected routes via `RequireAuth` wrapper.

**API Client:** Axios instance (`src/api/client.ts`) with:
- Automatic CSRF token handling for Django
- Credential inclusion (cookies)
- 401 redirect handling

**UI:** Tailwind CSS + Radix UI components (shadcn/ui pattern)

**Forms:** React Hook Form + Zod validation

### Multi-Tenancy Model

Organizations are the tenant entity. Users can belong to multiple organizations via Memberships with role-based access (owner/admin/member). The commented-out `TenantMiddleware` in `backend/config/settings/base.py:47` suggests tenant isolation is planned but not fully implemented.

### Authentication Flow

- Session-based authentication with Django (uses cookies)
- CSRF protection via Django middleware
- Frontend stores auth state via `useAuth` hook
- OAuth providers (Google, GitHub) configured via django-allauth

## Environment Configuration

Copy `saas-boilerplate/.env.example` to `saas-boilerplate/.env` and configure:
- Django secret key (50+ chars recommended)
- Database URL (PostgreSQL)
- Redis URL
- Stripe API keys (test mode for development)
- Email backend (Mailpit for local, SMTP for production)
- OAuth credentials (optional)

## Testing

Backend tests use pytest with Django settings module `config.settings.test` (configured in `pyproject.toml`).

Test files match patterns: `tests.py`, `test_*.py`, `*_tests.py`

## Database

PostgreSQL 16 (Alpine) with health checks. Database URL format: `postgres://user:password@host:port/dbname`

## Common Patterns

### Adding New Django Apps

1. Create app in `backend/apps/`
2. Add to `INSTALLED_APPS` in `backend/config/settings/base.py`
3. Create models, views, serializers
4. Add URL patterns to `backend/config/urls.py`
5. Run `make makemigrations` and `make migrate`

### Adding New API Endpoints

URLs follow pattern: `/api/v1/<app-name>/<endpoint>`

Use DRF ViewSets or APIViews. API schema auto-generated via drf-spectacular.

### Frontend API Integration

1. Define TypeScript types in `src/types/`
2. Create API functions in `src/api/`
3. Use React Query hooks in components/pages
4. Handle errors via axios interceptors

## Technology Stack

**Backend:**
- Django 5.1+, DRF 3.15+
- PostgreSQL (psycopg 3)
- Redis, Celery
- Stripe, django-allauth
- Gunicorn/Uvicorn

**Frontend:**
- React 18, TypeScript 5
- Vite, React Router v6
- TanStack Query, Zustand
- Tailwind CSS, Radix UI
- Axios, React Hook Form + Zod

**Infrastructure:**
- Docker Compose
- Traefik reverse proxy
- Mailpit (email testing)
