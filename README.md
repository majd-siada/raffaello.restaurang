# Raffaello Restaurang

Public website and staff admin for **Raffaello Stekhus & Bar** (Boden). React frontend, Django API, PostgreSQL. Public content is Swedish. Site copy and NAP live in [`frontend/src/siteConfig.js`](frontend/src/siteConfig.js).

**Production:** [https://raffaello.se](https://raffaello.se) on Hetzner via Docker Compose ([`docker-compose.yml`](docker-compose.yml), edge [`nginx/nginx.conf`](nginx/nginx.conf)).

## Structure

```text
frontend/                 React + Vite + Tailwind (static nginx in Docker)
backend/                  Django + DRF + Gunicorn
nginx/                    TLS edge reverse proxy
docker-compose.yml        db, backend, frontend, nginx, certbot
.github/workflows/        deploy, backup, ops smoke
docs/ops/                 backup/restore + post-launch operations
docs/LUNCH_MATOCHMAT.md   Mat och Mat lunch sync
```

## Surfaces

| URL | Role |
|-----|------|
| https://raffaello.se/ | Public site |
| https://raffaello.se/admin/ | React Admin (staff, session + CSRF) |
| https://raffaello.se/django-admin/ | Classic Django Admin (emergency) |
| https://raffaello.se/api/ | Public + staff APIs |

Legacy `/ops` and `/api/ops/*` remain as compatibility aliases of Admin.

## Public API (high level)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/health/` | `ok` |
| GET | `/api/menu/` | Categories + items |
| GET | `/api/lunch/` | Current lunch week |
| GET | `/api/offers/` | Weekly offer |
| GET | `/api/reviews/` | Published reviews |
| GET | `/api/gallery/` | Published gallery |
| GET | `/api/faq/` | Published FAQ |
| GET | `/api/restaurant/` | Hours + booking config |
| POST | `/api/bookings/` | Booking inquiry (throttled) |
| * | `/api/admin/*` | Staff only (anon → 403) |

## Local development

**Backend**

```bash
cd backend
python -m venv ../venv && source ../venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

**Frontend** (Vite proxies `/api` → `127.0.0.1:8000`)

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173/
```

## Production deploy

1. DNS `A`/`www` → server IP.
2. Server secrets (never commit): root `.env.db` from [`.env.db.example`](.env.db.example), `backend/.env` from [`backend/.env.example`](backend/.env.example).
3. TLS via Let's Encrypt (`init-letsencrypt.sh` / certbot volume).
4. Push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) (SSH → `git reset --hard origin/main` → `docker compose build/up`).

Secrets: `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`.

Smoke after deploy: `/`, `/api/health/`, `/meny`, `/admin/`, `/django-admin/`.

Ops runbooks: [`docs/ops/BACKUP_AND_RESTORE.md`](docs/ops/BACKUP_AND_RESTORE.md), [`docs/ops/POST_LAUNCH_OPERATIONS.md`](docs/ops/POST_LAUNCH_OPERATIONS.md).

## Booking alerts (Telegram)

Guests book via `/boka`. Backend stores the booking and notifies the restaurant via Telegram only after notify succeeds (otherwise rollback). Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `backend/.env`. Daily self-test: `run_daily_booking_test` at 10:00 Europe/Stockholm.

## Lunch sync

Server-side import from Mat och Mat — see [`docs/LUNCH_MATOCHMAT.md`](docs/LUNCH_MATOCHMAT.md). Frontend never scrapes the source.

## Staff users

Create staff with Django permissions (prefer non-superuser). Menu editors:

```bash
cd backend
python manage.py create_menu_editor USERNAME
```

Never commit passwords.
