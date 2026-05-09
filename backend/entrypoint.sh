#!/bin/sh
set -e

echo "Waiting for postgres..."
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "PostgreSQL is up."

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn raffaello.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --timeout 120
