# Backend quality toolkit

- Install dev tools: `pip install -e ".[dev]"` (run from this directory).
- Optional: `pre-commit install` to enforce checks before every commit.

## Everyday commands

- `make lint` — static analysis and import order via ruff.
- `make format` — auto-format with ruff's formatter.
- `make typecheck` — mypy with django-stubs.
- `make test-local` — run pytest.

## Environment expectations

- Use `.env.example` for local dev and `.env.production.example` as a template for production; populate secrets in your real `.env`.
- Required in prod: `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, DB credentials (`DB_*`), and `FRONTEND_URL` for links/CORS/CSRF.
- Optional but recommended: Redis (`REDIS_URL`), Stripe keys, OAuth client IDs/secrets, SMTP settings.
- All environments use `config.settings`. Behavior is controlled by environment variables (e.g., `DJANGO_DEBUG`, `TESTING`).
