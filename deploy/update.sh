#!/usr/bin/env bash
#
# Publica los últimos cambios en el servidor.
#
#   bash /opt/nass/deploy/update.sh
#
set -euo pipefail

DESTINO="${NASS_DIR:-/opt/nass}"
RAMA="${NASS_BRANCH:-claude/nice-archimedes-3l6hid}"

[[ "$(id -u)" -eq 0 ]] || { echo "Ejecuta este script como root." >&2; exit 1; }

# Este script vive dentro del repositorio que va a actualizar. Bash lee el
# archivo a medida que lo ejecuta, así que un `git reset` sobre sí mismo puede
# provocar un comportamiento impredecible. Se copia a /tmp y sigue desde allí.
if [[ "${NASS_REEJECUTADO:-}" != "1" ]]; then
  COPIA="$(mktemp /tmp/nass-update-XXXXXX.sh)"
  cp "${BASH_SOURCE[0]}" "$COPIA"
  export NASS_REEJECUTADO=1
  exec bash "$COPIA" "$@"
fi

echo "==> Trayendo $RAMA"
git -C "$DESTINO" fetch --depth 1 origin "$RAMA"
git -C "$DESTINO" reset --hard "origin/$RAMA"

echo "==> Compilando"
cd "$DESTINO"
npm ci --no-audit --no-fund
npm run build

echo "==> Reiniciando"
# Reiniciar devuelve el sistema a los datos demo: el almacén vive en memoria.
if command -v pm2 >/dev/null 2>&1 && pm2 describe nass >/dev/null 2>&1; then
  pm2 restart nass --update-env
  sleep 4
  pm2 status nass
else
  systemctl restart nass
  sleep 4
  systemctl is-active --quiet nass && echo "servicio activo" || {
    echo "no arrancó: journalctl -u nass -n 50 --no-pager" >&2; exit 1; }
fi
echo "==> Listo."
