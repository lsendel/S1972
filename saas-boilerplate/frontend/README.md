# Frontend Environment Configuration

## Env files
- `.env` (local dev): defaults to `VITE_API_URL=http://localhost:8000`
- `.env.example`: reference for local development
- `.env.production.example`: reference for production (set to your API host, no `/api/v1` suffix)

**Important:** `VITE_API_URL` should be the host only; the app automatically appends `/api/v1`.

## Running locally
```bash
cp .env.example .env
npm install
npm run dev
```

Ensure the backend is reachable at the host configured in `VITE_API_URL` (defaults to http://localhost:8000). For E2E, `.env.e2e` is already provided.
