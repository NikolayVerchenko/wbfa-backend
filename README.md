# wbfa-backend

MVP backend for WB Finance Analytics (NestJS + Postgres + Redis).

## Features

- JWT auth (`register`, `login`)
- Tenant created during registration
- WB accounts CRUD (list/create)
- WB token storage encrypted with AES-256-GCM
- Strict WB proxy endpoints (whitelisted only)
- External API throttling: `60 req/min` per IP
- Internal WB per-account route-group rate limits in Redis
- CORS restricted to `FRONTEND_ORIGIN`

## Requirements

- Node.js `20.19+` or `22.12+`
- Docker + Docker Compose

## Environment

Create `.env` in repository root (next to `docker-compose.yml`) from `.env.example`:

```env
POSTGRES_PASSWORD=change_me
JWT_SECRET=change_me
ENC_KEY=<32-byte-base64>
FRONTEND_ORIGIN=https://app.domain
PORT=3000
DB_SYNCHRONIZE=true
```

Generate `ENC_KEY` example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Run with Docker

From `e:\Sites\WB_NEW`:

```bash
docker compose up -d --build
```

API will be available at `http://localhost:3000/api`.

## Run locally (without Docker)

From `e:\Sites\WB_NEW\wbfa-backend`:

```bash
npm install
npm run start:dev
```

Local env variables for DB/Redis:

- `POSTGRES_HOST` (default `db`)
- `POSTGRES_PORT` (default `5432`)
- `POSTGRES_USER` (default `postgres`)
- `POSTGRES_PASSWORD`
- `POSTGRES_DB` (default `wbfa`)
- `REDIS_HOST` (default `redis`)
- `REDIS_PORT` (default `6379`)

## Auth endpoints

- `POST /api/auth/register`
  - body: `{ "email": "...", "password": "...", "tenantName": "optional" }`
  - creates tenant + user + default account
- `POST /api/auth/login`
  - body: `{ "email": "...", "password": "..." }`

Both return:

```json
{ "accessToken": "..." }
```

## Accounts endpoints

- `GET /api/accounts`
- `POST /api/accounts` body: `{ "name": "WB account 2" }`
- `PUT /api/accounts/:accountId/token` body: `{ "token": "WB_API_TOKEN" }`
- `POST /api/accounts/:accountId/token/verify`

All account endpoints require:

```http
Authorization: Bearer <JWT>
```

WB token is never returned and never logged.

## WB proxy endpoints (whitelist)

All require `Authorization: Bearer <JWT>`.

- `POST /api/wb/:accountId/statistics/reportDetailByPeriod`
- `GET /api/wb/:accountId/advert/adv/v1/upd?from=&to=`
- `GET /api/wb/:accountId/advert/api/advert/v2/adverts?ids=`
- `GET /api/wb/:accountId/reports/paid_storage?dateFrom=&dateTo=`
- `GET /api/wb/:accountId/reports/paid_storage/tasks/:taskId/status`
- `GET /api/wb/:accountId/reports/paid_storage/tasks/:taskId/download`
- `GET /api/wb/:accountId/reports/acceptance_report?dateFrom=&dateTo=`
- `GET /api/wb/:accountId/reports/acceptance_report/tasks/:taskId/status`
- `GET /api/wb/:accountId/reports/acceptance_report/tasks/:taskId/download`

No arbitrary proxy path is allowed.

## Frontend integration (MVP)

- Frontend stores backend JWT (`Authorization: Bearer <JWT>`)
- `VITE_WB_PROXY_URL` must point to backend API root, for example:
  - `https://your-domain/api`
- Use account-aware routes:
  - `/api/wb/:accountId/...`

Example frontend request:

```http
POST https://your-domain/api/wb/<accountId>/statistics/reportDetailByPeriod
Authorization: Bearer <JWT>
Content-Type: application/json
```

## Notes

- `DB_SYNCHRONIZE=true` is used for MVP only.
- Internal WB limits (per account + group):
  - `statistics`: 2 rps
  - `advert_upd`: 1 rps
  - `advert_adverts`: 5 rps
  - `reports`: 1 rps
