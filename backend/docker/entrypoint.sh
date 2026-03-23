#!/bin/sh
set -e

if [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
  mkdir -p /var/www/html/database
  touch /var/www/html/database/database.sqlite
fi

php artisan config:clear >/dev/null 2>&1 || true
php artisan route:clear >/dev/null 2>&1 || true
php artisan view:clear >/dev/null 2>&1 || true
php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
