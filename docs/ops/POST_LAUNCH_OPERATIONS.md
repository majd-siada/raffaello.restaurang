# Post-launch operations — Raffaello

**Scope:** production operations only (backup, HTTPS hardening, compatibility surfaces).  
**No product features / no UI redesign.**

---

## Current production posture

| Area | State |
|------|--------|
| Public site + React Admin | Production verified |
| Opening hours | `OPENING_HOURS_SOURCE=db` |
| FAQ CMS | Published via DB; legal remains frontend/empty honest |
| Lunch | `MATOCHMAT_SYNC_ENABLED=true`, 09:00 Europe/Stockholm |
| Legacy `/ops` | Intentionally retained (compatibility) |
| Django Admin | `/django-admin/` emergency only |

---

## Backup & restore

Authoritative runbook: [BACKUP_AND_RESTORE.md](./BACKUP_AND_RESTORE.md)

Workflow: `.github/workflows/db-backup.yml`

| Mode | Purpose |
|------|---------|
| `audit` | Inventory + headers (no dump of secrets) |
| `backup` | Create `/root/raffaello-backups/*.sql.gz` |
| `restore-drill` | Isolated Postgres 17 restore test |

Scheduled: daily `15 2 * * *` UTC.

---

## HSTS

### Audit evidence (2026-09-15)

| Check | Result |
|-------|--------|
| `http://raffaello.se` → HTTPS | `301` to `https://raffaello.se/` |
| `https://raffaello.se` | `200` |
| `https://www.raffaello.se` | `200` |
| Mixed `http://` assets in HTML shell | None observed |
| Prior `Strict-Transport-Security` | Absent (`SECURE_HSTS_SECONDS=0`) |

### Decision

**Enable HSTS at the TLS edge (nginx)** — Django alone cannot stamp HSTS on SPA HTML served by the frontend container.

- nginx: `Strict-Transport-Security: max-age=31536000; includeSubDomains` on the HTTPS server
- Django `SECURE_HSTS_SECONDS=31536000` still set for API/Django-Admin responses
- `preload` **OFF** (not submitted to browser preload lists)

### Rollback

Remove the nginx `add_header Strict-Transport-Security …` line and set `SECURE_HSTS_SECONDS=0`, recreate nginx/backend. Browsers may cache HSTS until max-age expires — plan accordingly.

---

## Compatibility surfaces

| Path | Policy |
|------|--------|
| `/admin` | React Admin (primary) |
| `/django-admin/` | Emergency Django Admin — keep |
| `/ops` | Temporary compatibility — do not delete without staff cutover plan |
| `/api/ops/*` | Temporary alias of `/api/admin/*` |

---

## Useful workflows

| Workflow | Use |
|----------|-----|
| Deploy to Hetzner | Push to `main` |
| Ops production smoke | Authenticated ephemeral staff API smoke |
| DB backup and restore drill | Backup / isolated restore / audit |
| Debug backend logs | Log sampling |

Never print `DATABASE_URL`, DB passwords, Telegram tokens, or session cookies in logs or tickets.
