#!/usr/bin/env bash
set -euo pipefail

# Ensure only mpm_prefork is loaded (prevents AH00534: More than one MPM loaded)
rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf
ln -sf /etc/apache2/mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load
ln -sf /etc/apache2/mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf

PORT="${PORT:-8000}"
sed -i -E "s/^Listen [0-9]+/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i -E "s/<VirtualHost \*:[0-9]+>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan migrate --force --seed

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

exec apache2-foreground
