#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8000}"
sed -i "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -i "s/:80>/:${PORT}>/g" /etc/apache2/sites-available/000-default.conf

php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan migrate --force --seed

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

exec apache2-foreground
