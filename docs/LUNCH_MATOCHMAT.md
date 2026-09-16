# Mat och Mat lunch ingestion

Scheduler: `MATOCHMAT_SYNC_ENABLED` (production: enabled), daily **09:00 Europe/Stockholm**.

## Architecture

```text
Mat och Mat (allowlisted HTTPS URL)
  → backend fetch (timeout, size, redirect, SSRF allowlist)
  → deterministic parser v2 (TSR/React Flight) / v1 JSON fallback
  → normalize + SHA-256 content hash
  → change detection + skip_auto_sync (manual override)
  → LunchWeek / LunchDish (+ LunchImportRun log)
  → GET /api/lunch/
  → frontend /lunch (never scrapes Mat och Mat)
```

Canonical source URL:

`https://www.matochmat.se/restauranger/boden/lunch/raffaello-stekhus-bar/`

`robots.txt` does not disallow this path (verified earlier). Fetcher identifies as `RaffaelloLunchSync/1.0`.

## Model (extended, history preserved)

Existing `LunchWeek` + `LunchDish` retained. Added fields on `LunchWeek`:

- `source_type` — `MANUAL` | `EXTERNAL_MATOCHMAT`
- `source_url`, `source_hash`, `fetched_at`, `published_at`
- `source_last_updated`, `parser_version`, `last_import_status`
- `lunch_hours_text`

`skip_auto_sync` = **manual override**. When true, importer never overwrites that week.

New `LunchImportRun` for observability.

Migration: `lunch.0004_matochmat_import_metadata` (additive — does not delete history).

## Date logic

- Timezone authority: `Europe/Stockholm`
- Current ISO week selected from parsed menus
- Today’s dishes = weekday match; missing today does **not** invent dishes
- Other week only in source → `STALE` / current week `NOT_PUBLISHED` (empty), without inventing content

## Failure safety

| Condition | Behavior |
|-----------|----------|
| Network / HTTP failure | `FETCH_FAILED` — leave published weeks untouched |
| HTML / parse failure | `PARSE_FAILED` — leave published weeks untouched |
| Unchanged hash | `UNCHANGED` — no dish rewrite |
| Manual override | `SKIPPED_OVERRIDE` |
| Empty current week in source | `NOT_PUBLISHED` / `STALE` as applicable |

## Scheduler

- Entrypoint loop: **09:00 Europe/Stockholm**
- Gated by `MATOCHMAT_SYNC_ENABLED` (default **false**)
- Enable only after controlled manual import verification

## Manual run

```bash
cd backend
python manage.py sync_matochmat_lunch --dry-run --no-notify
python manage.py sync_matochmat_lunch --no-notify
```

## API

- `GET /api/lunch/` — backwards-compatible; optional extras: `source_type`, `source_url`, `fetched_at`, `source_attribution`, `lunch_hours_text`, `today_weekday`, `today_has_dishes`
- `GET /api/lunch/import-status/` — last run / success / failure / current week summary (no secrets)

## Admin

Lunch weeks show source type, import status, hash, fetched time, source URL, parser version. Import runs are read-only.

## Frontend

`/lunch` consumes Raffaello API only. Source attribution is not shown on the public page. Honest empty state unchanged.
