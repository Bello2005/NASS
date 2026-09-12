#!/usr/bin/env bash
#
# Instalación de NASS Ciudadano en un servidor Ubuntu o Debian limpio.
#
#   bash install.sh nass.midominio.com correo@midominio.com
#
# Es idempotente: puedes volver a ejecutarlo sin romper nada. La primera pasada
# se detiene para que escribas la clave de CARTO; la segunda termina la
# instalación.
#
set -euo pipefail

DOMINIO="${1:-}"
CORREO="${2:-}"
REPO="${NASS_REPO:-https://github.com/Bello2005/NASS.git}"
RAMA="${NASS_BRANCH:-claude/nice-archimedes-3l6hid}"
DESTINO="${NASS_DIR:-/opt/nass}"
USUARIO=nass

rojo()  { printf '\033[0;31m%s\033[0m\n' "$*"; }
verde() { printf '\033[0;32m%s\033[0m\n' "$*"; }
paso()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

if [[ -z "$DOMINIO" || -z "$CORREO" ]]; then
  rojo "Uso: bash install.sh <subdominio> <correo>"
  rojo "Ejemplo: bash install.sh nass.midominio.com yo@midominio.com"
  exit 1
fi

if [[ "$(id -u)" -ne 0 ]]; then
  rojo "Ejecuta este script como root."
  exit 1
fi

paso "1/8 · Paquetes del sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx openssl ca-certificates >/dev/null

# Node 22. Si ya hay una versión 20 o superior, se respeta.
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -lt 20 ]]; then
  paso "    Instalando Node 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
verde "    node $(node -v) · npm $(npm -v) · nginx listo"

paso "2/8 · Usuario de servicio"
# La aplicación no corre como root.
if ! id -u "$USUARIO" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir /var/lib/nass --shell /usr/sbin/nologin "$USUARIO"
  verde "    usuario '$USUARIO' creado"
else
  verde "    usuario '$USUARIO' ya existía"
fi

paso "3/8 · Código fuente en $DESTINO"
if [[ -d "$DESTINO/.git" ]]; then
  git -C "$DESTINO" fetch --depth 1 origin "$RAMA"
  git -C "$DESTINO" reset --hard "origin/$RAMA"
  verde "    actualizado a lo último de $RAMA"
else
  git clone --depth 1 --branch "$RAMA" "$REPO" "$DESTINO"
  verde "    clonado $RAMA"
fi

paso "4/8 · Configuración"
ENV_FILE="$DESTINO/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" <<ENV
# Clave de los basemaps de CARTO. Sin ella el mapa sale con marca de agua.
# Se incrusta al compilar: si la cambias, hay que volver a compilar.
NEXT_PUBLIC_CARTO_API_KEY=
NEXT_PUBLIC_CARTO_STYLE=dark_all

# Secreto de firma de sesiones, generado para este servidor.
NASS_AUTH_SECRET=$(openssl rand -hex 32)

NASS_SIMULATOR=on
NASS_SIM_SPEED_KMH=55
ENV
  chmod 600 "$ENV_FILE"
  verde "    creado $ENV_FILE con un secreto de sesión nuevo"
fi
chown "$USUARIO:$USUARIO" "$ENV_FILE"

# La clave de CARTO se incrusta al compilar: sin ella, compilar no tiene sentido.
if ! grep -q '^NEXT_PUBLIC_CARTO_API_KEY=.\+' "$ENV_FILE"; then
  echo
  rojo "Falta la clave de CARTO."
  echo
  echo "  1. Edita:  nano $ENV_FILE"
  echo "  2. Rellena: NEXT_PUBLIC_CARTO_API_KEY=tu_clave"
  echo "  3. Vuelve a ejecutar este mismo comando."
  echo
  echo "Sin clave el sistema funciona, pero el mapa sale con la marca de agua"
  echo "'API KEY REQUIRED' encima. Se obtiene gratis en https://carto.com/"
  exit 1
fi

paso "5/8 · Memoria para compilar"
RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [[ "$RAM_MB" -lt 2000 ]] && [[ ! -f /swapfile ]]; then
  # Compilar Next con menos de 2 GB falla por falta de memoria.
  verde "    ${RAM_MB} MB de RAM: añadiendo 2 GB de swap"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
  verde "    ${RAM_MB} MB de RAM: suficiente"
fi

paso "6/8 · Compilando (tarda unos minutos)"
chown -R "$USUARIO:$USUARIO" "$DESTINO"
sudo -u "$USUARIO" env npm_config_cache=/tmp/.npm-nass \
  bash -c "cd '$DESTINO' && npm ci --no-audit --no-fund && npm run build"
verde "    compilado"

paso "7/8 · Servicio permanente"
install -m 644 "$DESTINO/deploy/nass.service" /etc/systemd/system/nass.service
systemctl daemon-reload
systemctl enable nass >/dev/null 2>&1
systemctl restart nass
sleep 3
if systemctl is-active --quiet nass; then
  verde "    servicio activo y habilitado en el arranque"
else
  rojo "    el servicio no arrancó. Mira: journalctl -u nass -n 50 --no-pager"
  exit 1
fi

paso "8/8 · Dominio y certificado"
sed "s/__DOMINIO__/$DOMINIO/g" "$DESTINO/deploy/nginx-nass.conf" > /etc/nginx/sites-available/nass
ln -sf /etc/nginx/sites-available/nass /etc/nginx/sites-enabled/nass
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
verde "    nginx sirviendo $DOMINIO"

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 'Nginx Full' >/dev/null 2>&1 || true
  verde "    cortafuegos: 80 y 443 abiertos, 3000 cerrado al exterior"
fi

# El botón de pánico necesita HTTPS: navigator.geolocation solo funciona en
# contexto seguro. Sin certificado, el celular no entrega el GPS.
apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
if certbot --nginx -d "$DOMINIO" --non-interactive --agree-tos -m "$CORREO" --redirect; then
  verde "    certificado TLS instalado"
else
  rojo "    certbot falló. Comprueba que el registro DNS A de $DOMINIO"
  rojo "    apunte a la IP de este servidor y vuelve a ejecutar el script."
  rojo "    El sitio queda accesible por HTTP, pero SIN HTTPS el botón de"
  rojo "    pánico no podrá leer el GPS del celular."
fi

echo
verde "═══════════════════════════════════════════════"
verde " NASS Ciudadano desplegado"
verde "═══════════════════════════════════════════════"
echo
echo "  https://$DOMINIO"
echo
echo "  Cuentas demo (contraseña: nass2026)"
echo "    ciudadano@demo.nass.co   app ciudadana"
echo "    operador@nass.gov.co     centro de despacho"
echo "    pol-031@nass.gov.co      panel de unidad"
echo "    admin@nass.gov.co        administración"
echo
echo "  Estado:      systemctl status nass"
echo "  Registro:    journalctl -u nass -f"
echo "  Actualizar:  bash $DESTINO/deploy/update.sh"
echo
echo "  Los datos viven en memoria: reiniciar el servicio devuelve"
echo "  el sistema a los datos de demostración."
echo
