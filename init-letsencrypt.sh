#!/bin/bash
# init-letsencrypt.sh
# Run this ONCE on the server after DNS is pointing to your IP.
# It bootstraps Let's Encrypt certificates so nginx can start with SSL.

set -e

DOMAIN="din-domain.se"
EMAIL="admin@din-domain.se"   # <-- change to your real email
STAGING=0                     # set to 1 to test without hitting rate limits

DATA_PATH="./certbot"

if [ -d "$DATA_PATH/conf/live/$DOMAIN" ]; then
  echo "Certificates already exist for $DOMAIN. Skipping."
  exit 0
fi

echo "### Downloading recommended TLS parameters..."
mkdir -p "$DATA_PATH/conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
  > "$DATA_PATH/conf/options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
  > "$DATA_PATH/conf/ssl-dhparams.pem"

echo "### Creating dummy certificate for $DOMAIN (so nginx can start)..."
mkdir -p "$DATA_PATH/conf/live/$DOMAIN"
docker compose run --rm --entrypoint "openssl req -x509 -nodes -newkey rsa:4096 \
  -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
  -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
  -days 1 -subj '/CN=localhost'" certbot

echo "### Starting nginx only (no build)..."
cat > /tmp/nginx_acme.conf << 'EOF'
server {
    listen 80;
    server_name din-domain.se www.din-domain.se;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 'ok';
    }
}
EOF
docker run --rm -d --name nginx_tmp \
  -p 80:80 \
  -v "/tmp/nginx_acme.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$(pwd)/certbot/www:/var/www/certbot:ro" \
  nginx:1.27-alpine
sleep 3

echo "### Deleting dummy certificate..."
docker compose run --rm --entrypoint "rm -rf /etc/letsencrypt/live/$DOMAIN /etc/letsencrypt/archive/$DOMAIN /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

echo "### Requesting Let's Encrypt certificate..."
STAGING_ARG=""
if [ $STAGING -eq 1 ]; then
  STAGING_ARG="--staging"
fi

docker compose run --rm --entrypoint "certbot certonly --webroot \
  -w /var/www/certbot \
  $STAGING_ARG \
  --email $EMAIL \
  -d $DOMAIN -d www.$DOMAIN \
  --rsa-key-size 4096 \
  --agree-tos \
  --no-eff-email \
  --force-renewal" certbot

echo "### Stopping temporary nginx..."
docker stop nginx_tmp || true

echo "### Building and starting all services..."
docker compose up -d --build

echo ""
echo "Done! SSL certificates obtained."
echo "Now run: docker compose up -d --build"
