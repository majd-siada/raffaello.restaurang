#!/bin/sh
set -e

echo "Waiting for postgres..."
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "PostgreSQL is up."

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Seconds until the next 11:59 or 23:59 Europe/Stockholm.
seconds_until_next_lunch_sync() {
  python - <<'PY'
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

tz = ZoneInfo("Europe/Stockholm")
now = datetime.now(tz)
candidates = []
for day_offset in range(0, 2):
    day = (now + timedelta(days=day_offset)).date()
    for hour, minute in ((11, 59), (23, 59)):
        target = datetime(day.year, day.month, day.day, hour, minute, tzinfo=tz)
        if target > now:
            candidates.append(target)
print(int((min(candidates) - now).total_seconds()))
PY
}

# Sync lunch from Mat och Mat at 11:59 and 23:59 (Europe/Stockholm).
# Also clean up old bookings on the same schedule. Run once on boot so deploys
# pick up the current menu immediately.
(
  python manage.py cleanup_old_bookings || true
  python manage.py sync_matochmat_lunch || true

  while true; do
    sleep "$(seconds_until_next_lunch_sync)"
    python manage.py cleanup_old_bookings || true
    python manage.py sync_matochmat_lunch || true
    # Avoid re-firing in the same minute.
    sleep 60
  done
) &

exec gunicorn raffaello.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --timeout 120
