# Raffaello Restaurang

Restaurant website for **Raffaello Restaurang** (Boden). Fullstack monorepo with a React frontend and Django backend, connected to PostgreSQL. Public content is in **Swedish**. Site-specific strings (adress, telefon, öppettider, m.m.) live in [`frontend/src/siteConfig.js`](frontend/src/siteConfig.js).

Production target: **raffaello.se** on a **Hetzner VPS** using **Docker Compose** ([`docker-compose.yml`](docker-compose.yml), edge [`nginx/nginx.conf`](nginx/nginx.conf)).

---

## Project Structure

```
raffaello.restaurang/
├── frontend/                  # React + Vite + Tailwind CSS (Docker: built static → nginx)
├── backend/                   # Django + DRF + Gunicorn (Docker: entrypoint migrate + collectstatic)
├── nginx/                     # Edge reverse proxy + TLS (raffaello.se)
├── certbot/                   # Let's Encrypt volumes (on server; not committed)
├── docker-compose.yml         # db, backend, frontend, nginx, certbot
├── .github/workflows/deploy.yml  # SSH to server: pull, compose build/up
├── .env.db.example            # Template for Postgres container env (root `.env.db` on server)
├── venv/                      # Local Python venv (gitignored)
└── README.md
```

---

## Tech Stack

| Layer      | Technology                        | Version   |
|------------|-----------------------------------|-----------|
| Frontend   | React                             | 19.2      |
| Bundler    | Vite                              | 7.3       |
| Styling    | Tailwind CSS v4 (Vite plugin)     | 4.2       |
| Routing    | react-router-dom                  | latest    |
| Backend    | Django                            | 6.0.3     |
| API        | Django REST Framework             | 3.16.1    |
| CORS       | django-cors-headers               | 4.9.0     |
| Env vars   | python-dotenv                     | 1.2.2     |
| Database   | PostgreSQL                        | 17.9      |
| DB Adapter | psycopg2-binary                   | 2.9.11    |
| Python     | 3.13.2                            |           |
| Node.js    | 24.11.0                           |           |

---

## Database

### PostgreSQL Connection

- **Database**: `raffaello` (see `.env.db.example`)
- **User**: `postgres`
- **Password**: `test`
- **Host**: `127.0.0.1`
- **Port**: `5432`

Connect via CLI:
```bash
set PGPASSWORD=test
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h 127.0.0.1 -d raffaello
```

### Models

**Category** — Menu sections (e.g. Förrätter, Huvudrätter, Desserter, Drycker)
- `name` — CharField(100)
- `order` — PositiveIntegerField, controls display order
- Ordered by `order` field
- Related name from MenuItem: `items`

**MenuItem** — Individual dishes/drinks
- `category` — ForeignKey → Category (CASCADE, related_name='items')
- `name` — CharField(200)
- `description` — TextField (optional)
- `price` — DecimalField(max_digits=8, decimal_places=2)
- `is_available` — BooleanField (default True). When False, shows "Slutsåld" on frontend
- `order` — PositiveIntegerField, controls display order within category
- `created_at` — auto timestamp
- `updated_at` — auto timestamp
- Ordered by `category__order`, then `order`

### Seed Data (currently in DB)

4 categories, 9 items total:
- **Förrätter**: Vitlöksbröd (79 kr), Caesarsallad (109 kr)
- **Huvudrätter**: Grillad entrecôte (289 kr), Laxfilé (239 kr), Pasta Carbonara (189 kr)
- **Desserter**: Chokladfondant (99 kr), Crème brûlée (89 kr)
- **Drycker**: Coca-Cola (35 kr), Husets lemonad (55 kr)

---

## API

| Method | Endpoint      | Description                                          |
|--------|---------------|------------------------------------------------------|
| GET    | /api/health/  | Plain-text `ok` (container / uptime checks)          |
| GET    | /api/menu/    | All categories with nested menu items (public, read-only) |
| GET    | /admin/       | Django admin panel (login required)                  |

### GET /api/menu/ response shape:
```json
[
  {
    "id": 1,
    "name": "Förrätter",
    "order": 1,
    "items": [
      {
        "id": 1,
        "name": "Vitlöksbröd",
        "description": "Nybakat bröd med vitlökssmör",
        "price": "79.00",
        "is_available": true,
        "order": 1
      }
    ]
  }
]
```

---

## Django Admin

- **URL**: http://127.0.0.1:8000/admin/

| Roll | Användarnamn | Lösenord | Rättigheter |
|------|----------------|----------|-------------|
| Full admin (exempel) | `admin` | `admin123` | Allt — byt lösen i produktion. |
| Menyredaktör (exempel) | `meny` | `meny123` | Endast kategorier och menyobjekt. |

Gruppen **`Menyredaktör`** skapas av migration `menu.0004`. Användaren **`meny`** skapas med kommandot `create_menu_editor` (kör det igen om databasen återställds).

Fler menyredaktörer:

```powershell
cd backend
python manage.py create_menu_editor annat_namn --password "ett-säkert-lösenord"
# valfritt: --email person@example.se
```

Features configured:
- **CategoryAdmin**: list shows name + order, has inline MenuItems (TabularInline) so you can edit items directly from the category page
- **MenuItemAdmin**: list shows name, category, price, is_available. Price and is_available are **list_editable** (edit directly from the list view). Filterable by category and availability.

---

## Frontend Routes

| Path             | Component     | Swedish label | Description                                      |
|------------------|---------------|---------------|--------------------------------------------------|
| /                | Home          | Hem           | Hero, teaser, menu preview, map, öppettider      |
| /meny            | Menu          | Meny          | Fetches API, categories + items, "Slutsåld"      |
| /om-oss          | About         | Om oss        | Om oss (styling + copy)                          |
| /kontakt         | Contact       | Kontakt       | Kontakt (styling + copy)                         |
| /privata-events  | PrivateEvents | (länkad)      | Info om större sällskap                          |

I **lokal utveckling** proxar Vite `/api` till backend (`frontend/vite.config.js`) så menyn kan anropa `/api/menu/` relativt. I **Docker-produktion** är `VITE_API_URL` tom i frontend-bygget; webbläsaren anropar samma domän och edge-nginx skickar `/api/` till Gunicorn.

---

## Before first production deploy (raffaello.se, Hetzner, Docker)

1. **DNS**  
   Sätt `A` (och ev. `www`) mot serverns publika IP.

2. **Secrets på servern (committas aldrig)**  
   - Kopiera [`.env.db.example`](.env.db.example) till **repo-roten** som `.env.db` (starkt `POSTGRES_PASSWORD`).  
   - Kopiera [`backend/.env.example`](backend/.env.example) till `backend/.env` med **production-blocket** aktivt: `DEBUG=False`, `ALLOWED_HOSTS=raffaello.se,www.raffaello.se`, HTTPS-origins för CORS/CSRF, `DB_HOST=db`, och samma `DB_NAME` / `DB_USER` / `DB_PASSWORD` som i `.env.db`.  
   - Generera en ny `SECRET_KEY` till produktion.

3. **Första Let’s Encrypt-certifikatet**  
   [`nginx/nginx.conf`](nginx/nginx.conf) refererar till `/etc/letsencrypt/live/raffaello.se/`. Innan de filerna finns kan nginx inte starta med nuvarande 443-block. Vanlig ordning:  
   - Starta en **tillfällig** nginx/compose-setup som bara lyssnar på **80** och exponerar `/.well-known/acme-challenge/` (eller använd `certonly --standalone` med port 80 ledig).  
   - Kör t.ex. `certbot certonly --webroot -w /var/www/certbot` för `-d raffaello.se -d www.raffaello.se`.  
   - När certifikatet ligger under `certbot/conf/live/raffaello.se/`, kör full stack: `docker compose up -d --build`.  
   Containern `certbot` i compose kör **förnyelse** i loop; första utfärdandet görs manuellt enligt ovan.

4. **HTTPS i Django**  
   Med `DEBUG=False` sätter [`backend/raffaello/settings.py`](backend/raffaello/settings.py) `SECURE_PROXY_SSL_HEADER` och säkra cookies så admin/CSRF fungerar bakom nginx. Efter att HTTPS verifierats kan du sätta `SECURE_HSTS_SECONDS` i `backend/.env` (se `.env.example`).

5. **Röktest efter deploy**  
   - `https://raffaello.se/`  
   - `https://raffaello.se/api/health/` → `ok`  
   - `https://raffaello.se/meny`  
   - `https://raffaello.se/admin/` (byt svaga exempel-lösenord från README)

6. **GitHub Actions**  
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) förväntar sig repo i **`/home/raffaello`** på servern och secrets: `SSH_HOST`, `SSH_USER`, `SSH_PASSWORD`, `SSH_PORT`. Byt gärna till **SSH-nyckel** på sikt.

---

## Local Development

### Prerequisites
- Python 3.13+
- Node.js 24+
- PostgreSQL 17 installed and running on port 5432

### Backend & admin

**`/admin/` only works while Django is running.** If the browser shows `ERR_CONNECTION_REFUSED`, start the API (see below) and keep that terminal open.

```powershell
# From project root — first-time Python deps
python -m venv venv
.\venv\Scripts\activate
pip install -r backend\requirements.txt

# Ensure backend/.env exists (copy from backend/.env.example if needed), then:
cd backend
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
# → http://127.0.0.1:8000/admin/
```

### Frontend only

```powershell
cd frontend
npm install
npm run dev
# → http://localhost:5173/
```

### Frontend + API together (recommended)

From **project root** (starts Vite on 5173 and Django on 8000):

```powershell
npm install   # once, installs concurrently at repo root
npm run dev
```

Then open **http://127.0.0.1:8000/admin/** for Django admin and **http://localhost:5173/** for the site.

---

## Known Issues & Gotchas

1. **Parent directory Tailwind v3 conflict**: On some machines a parent-folder `postcss.config.js` / `tailwind.config.js` can conflict with Tailwind v4 Vite plugin. The `frontend/postcss.config.js` exists as an empty override; **do not delete it** if you hit PostCSS errors.

2. **Meny tom i dev**: Med tom `VITE_API_URL` proxar Vite `/api` till `http://127.0.0.1:8000` (`frontend/vite.config.js`). Kör backend på port 8000 samtidigt som `npm run dev` i `frontend/` (eller `npm run dev` i repo-roten). I admin måste **överordnad kategori** vara tomt för en **huvudkategori** — annars visas den bara som underrubrik under en annan kategori.

3. **localhost:8000 root**: Visiting `http://localhost:8000/` directly shows a 404. The backend only serves `/admin/` and `/api/menu/`. This is expected — the frontend is the user-facing app.

---

## Git

- Monorepo root: `raffaello.restaurang/`
- `.gitignore` covers: venv/, __pycache__/, .env, node_modules/, dist/, db.sqlite3, IDE files, OS files

---

## Design Decisions

- **Monorepo**: Single repo with `frontend/` and `backend/` folders. Simpler for a tightly coupled project.
- **Tailwind v4 Vite plugin**: Instead of the older PostCSS-based Tailwind v3 setup. Faster, simpler config.
- **python-dotenv**: Secrets loaded from `backend/.env` so credentials aren't in source code.
- **Nested serializers**: The API returns categories with items nested inside, so the frontend only needs one fetch to render the full menu.
- **Swedish throughout**: Django `LANGUAGE_CODE = 'sv'`, `TIME_ZONE = 'Europe/Stockholm'`. All UI text, URL paths, and page content in Swedish.
- **SQLite removed**: Started with SQLite, switched to PostgreSQL. The old `db.sqlite3` is gitignored.

---

## What's Done

- [x] React frontend (Vite + Tailwind v4): Home, Meny, Om oss, Kontakt, Privata events
- [x] React Router med svenska URL:er
- [x] Django + DRF, PostgreSQL, admin med menyredigering
- [x] Docker Compose: Postgres, Gunicorn, frontend-static, edge nginx, certbot-renewal
- [x] Produktion: proxy-TLS-inställningar i Django när `DEBUG=False`
- [x] Deploy-workflow mot Hetzner via SSH (se `.github/workflows/deploy.yml`)

## What's Next

- [ ] Första TLS-bootstrap på server + bekräfta smoke tests
- [ ] Säkerhet: starka admin-lösenord, ev. begränsa SSH / byta till nyckel i Actions
- [ ] Backups: `pg_dump` eller volym-backup på schema ni väljer
- [ ] Ev. bilduppladdning för menyposter
- [ ] Ev. HSTS (`SECURE_HSTS_SECONDS`) när HTTPS är verifierat
