#!/bin/sh
set -e

echo "Waiting for postgres..."
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "PostgreSQL is up."

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Seconds until the next 09:00 Europe/Stockholm (Mat och Mat lunch sync).
seconds_until_next_lunch_sync() {
  python - <<'PY'
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

tz = ZoneInfo("Europe/Stockholm")
now = datetime.now(tz)
candidates = []
for day_offset in range(0, 2):
    day = (now + timedelta(days=day_offset)).date()
    target = datetime(day.year, day.month, day.day, 9, 0, tzinfo=tz)
    if target > now:
        candidates.append(target)
print(int((min(candidates) - now).total_seconds()))
PY
}

# Seconds until the next 10:00 Europe/Stockholm (daily booking test).
seconds_until_next_booking_test() {
  python - <<'PY'
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

tz = ZoneInfo("Europe/Stockholm")
now = datetime.now(tz)
candidates = []
for day_offset in range(0, 2):
    day = (now + timedelta(days=day_offset)).date()
    target = datetime(day.year, day.month, day.day, 10, 0, tzinfo=tz)
    if target > now:
        candidates.append(target)
print(int((min(candidates) - now).total_seconds()))
PY
}

matochmat_sync_enabled() {
  case "$(printf '%s' "${MATOCHMAT_SYNC_ENABLED:-false}" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

# Sync lunch from Mat och Mat at 09:00 Europe/Stockholm when enabled.
# Default OFF until a controlled manual import is verified (MATOCHMAT_SYNC_ENABLED=true).
# Booking cleanup stays on the same cadence when the lunch loop runs; if lunch sync
# is disabled, still clean bookings once on boot and daily at 09:00.
(
  python manage.py cleanup_old_bookings || true

  if matochmat_sync_enabled; then
    echo "Mat och Mat lunch sync ENABLED — running initial sync."
    python manage.py sync_matochmat_lunch || true
  else
    echo "Mat och Mat lunch sync DISABLED (set MATOCHMAT_SYNC_ENABLED=true after verification)."
  fi

  while true; do
    sleep "$(seconds_until_next_lunch_sync)"
    python manage.py cleanup_old_bookings || true
    if matochmat_sync_enabled; then
      python manage.py sync_matochmat_lunch || true
    fi
    # Avoid re-firing in the same minute.
    sleep 60
  done
) &

# Daily booking → Telegram end-to-end test at 10:00 Europe/Stockholm.
# Uses the same create+notify path as real customers; does not kill gunicorn on FAIL.
(
  while true; do
    sleep "$(seconds_until_next_booking_test)"
    echo "Running daily booking test..."
    python manage.py run_daily_booking_test || true
    # Avoid re-firing in the same minute.
    sleep 60
  done
) &

exec gunicorn raffaello.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --timeout 120
