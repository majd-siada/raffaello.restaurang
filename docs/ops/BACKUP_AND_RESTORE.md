# Backup & Restore — Raffaello production

**Status:** Verified operational procedure (isolated restore drill).  
**Database:** PostgreSQL 17 (`postgres:17-alpine` via Docker Compose)  
**Host path (backups):** `/root/raffaello-backups/` (mode `700`, dumps `600`)  
**Not stored in:** git, public web root, `/media`, `/static`

---

## What exists

| Item | Reality |
|------|---------|
| Engine | PostgreSQL 17 on Docker volume `postgres_data` |
| Location | Hetzner VPS compose service `db` |
| Backup method | `pg_dump` → `gzip` via GitHub Actions + optional `scripts/backup-db.sh` |
| Format | `.sql.gz` (plain SQL, compressed) |
| Schedule | GitHub Actions cron `15 2 * * *` UTC (workflow `DB backup and restore drill`) |
| Retention | Delete dumps older than **14 days** (configurable `RETAIN_DAYS`) |
| Encryption at rest | **Not implemented** — rely on host disk permissions; recommendation below |
| Off-site copy | **Not automated** — recommendation: copy dumps off-box periodically |

---

## TEST PROCEDURE (safe — never overwrites production)

### A. Audit

GitHub → Actions → **DB backup and restore drill** → Run workflow → mode **`audit`**

Checks containers, Postgres version, existing dump listing, crontab, live HSTS headers, Django HSTS settings. Does not dump secrets.

### B. Create backup

Mode **`backup`** (also runs on schedule).

Evidence to expect in logs (no passwords):

```text
backup_file=raffaello_<db>_<timestamp>.sql.gz
backup_bytes=<n>
BACKUP_OK …
```

Integrity checks performed:

- file size > 1000 bytes
- `gzip -t`
- dump header contains `PostgreSQL database dump`

### C. Isolated restore drill

Mode **`restore-drill`**:

1. Uses latest dump under `/root/raffaello-backups/`
2. Starts a **temporary** `postgres:17-alpine` container on `127.0.0.1` only
3. Restores dump into that container
4. Counts critical tables
5. **Destroys** the temporary container

Production `db` service is never written.

Expect:

```text
RESTORE_DRILL_OK
counts menu=<n> hours=<≥7> migrations=<n> faq=<n>
```

### Manual backup on the server

```bash
cd /root/raffaello.restaurang
bash scripts/backup-db.sh
```

---

## ACTUAL PRODUCTION RECOVERY (incident only)

> This is **not** the restore drill. Only use after confirming a real data-loss / corruption incident.

1. **Identify incident** — what broke (accidental delete, bad migration, volume loss).
2. **Limit writes** — optionally `docker compose stop backend` to stop new bookings/writes.
3. **Identify latest valid backup** — `ls -lt /root/raffaello-backups/raffaello_*.sql.gz | head`
4. **Prefer isolated verify first** — run **restore-drill** on that file before touching production.
5. **Snapshot if possible** — Hetzner volume/snapshot or copy `postgres_data` volume before restore.
6. **Restore into production** (destructive — last resort):

```bash
cd /root/raffaello.restaurang
set -a; . ./.env.db; set +a
BACKUP=/root/raffaello-backups/raffaello_<db>_<timestamp>.sql.gz   # choose deliberately

docker compose stop backend
# Drop/recreate app DB objects carefully OR restore into a fresh volume after ops approval.
# Minimal pattern (requires downtime + approval):
gunzip -c "$BACKUP" | docker compose exec -T db \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1

docker compose start backend
docker compose exec -T backend python manage.py showmigrations --plan | tail
curl -fsS https://raffaello.se/api/health/
```

7. **Verify Django** — migrations applied; health `ok`.
8. **Verify data** — menu, lunch, offers, opening hours, FAQ via Admin / APIs.
9. **Restart** nginx/backend if needed: `docker compose up -d`
10. **Health checks** — `/api/health/`, `/`, `/meny`, `/lunch`, `/admin`, `/django-admin/`
11. **Public API smoke** — menu, restaurant, lunch, faq
12. **Admin smoke** — login + overview (Ops production smoke workflow)
13. **Confirm recovery** — document incident time, backup file used, verifier

If unsure: restore into a **new** Postgres volume / staging compose stack and cut over only after verification.

---

## Verification commands (non-secret)

```bash
# List backups
ls -lah /root/raffaello-backups/

# Gzip integrity
gzip -t /root/raffaello-backups/raffaello_*.sql.gz

# Header check
zcat /root/raffaello-backups/<file>.sql.gz | head -n 5
```

---

## Verification evidence (2026-09-15)

| Check | Evidence |
|-------|----------|
| Audit | `AUDIT_OK` — Postgres 17, Django `SECURE_HSTS_SECONDS=31536000` |
| Backup | `BACKUP_OK` — e.g. ~24–25 KB gzip SQL dump, `header_ok`, retain 14d |
| Isolated restore | `RESTORE_DRILL_OK` — `menu=117 hours=7 migrations=39 faq=8` |
| Production untouched | Drill used temporary `postgres:17-alpine` container, then removed |
| Workflow | `.github/workflows/db-backup.yml` + daily cron `15 2 * * *` UTC |

Runs (examples):

- Backup: https://github.com/majd-siada/raffaello.restaurang/actions/runs/35022774941
- Restore drill: https://github.com/majd-siada/raffaello.restaurang/actions/runs/35022806293

---

## Recommendations (not yet implemented)

| Item | Priority |
|------|----------|
| Off-site copy (second host / object storage) | HIGH |
| Encrypt dumps at rest (`gpg` / age) | MEDIUM |
| Hetzner volume snapshots as second layer | MEDIUM |
| Alert if scheduled backup workflow fails | MEDIUM |

---

## HSTS (related ops note)

See `docs/ops/POST_LAUNCH_OPERATIONS.md`. HTTPS redirect and apex+www verified; HSTS emitted from **nginx** (and Django for API responses). Preload remains OFF.
