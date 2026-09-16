#!/usr/bin/env bash
# Manual production DB backup helper (run on the Hetzner host).
# Usage (from /root/raffaello.restaurang):
#   bash scripts/backup-db.sh
#
# Writes gzipped SQL to /root/raffaello-backups/ (outside web root).
# Never prints DB passwords.

set -euo pipefail

APP_DIR="${APP_DIR:-/root/raffaello.restaurang}"
BACKUP_ROOT="${BACKUP_ROOT:-/root/raffaello-backups}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"

cd "$APP_DIR"
set -a
# shellcheck disable=SC1091
. ./.env.db
set +a

mkdir -p "$BACKUP_ROOT"
chmod 700 "$BACKUP_ROOT"

OUT="$BACKUP_ROOT/raffaello_${POSTGRES_DB}_${TS}.sql.gz"
docker compose exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl \
  | gzip -c > "$OUT"
chmod 600 "$OUT"

test "$BYTES" -gt 1000
gzip -t "$OUT"
set +e
HEADER=$(gzip -dc "$OUT" | head -c 400)
set -e
echo "$HEADER" | grep -qi 'PostgreSQL database dump'
echo "header_ok"

find "$BACKUP_ROOT" -type f -name 'raffaello_*.sql.gz' -mtime +"$RETAIN_DAYS" -delete || true
echo "BACKUP_OK retain_days=$RETAIN_DAYS"
