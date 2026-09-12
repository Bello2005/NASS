#!/usr/bin/env bash
#
# Publica los últimos cambios del repositorio en el servidor.
#
#   bash /opt/nass/deploy/update.sh
#
set -euo pipefail

DESTINO="${NASS_DIR:-/opt/nass}"
RAMA="${NASS_BRANCH:-claude/nice-archimedes-3l6hid}"
USUARIO=nass

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Ejecuta este script como root." >&2
  exit 1
fi

echo "==> Trayendo $RAMA"
git -C "$DESTINO" fetch --depth 1 origin "$RAMA"
git -C "$DESTINO" reset --hard "origin/$RAMA"
chown -R "$USUARIO:$USUARIO" "$DESTINO"

echo "==> Compilando"
sudo -u "$USUARIO" env npm_config_cache=/tmp/.npm-nass \
  bash -c "cd '$DESTINO' && npm ci --no-audit --no-fund && npm run build"

echo "==> Reiniciando"
# El servicio vuelve a los datos demo: el almacén vive en memoria.
systemctl restart nass
sleep 3

if systemctl is-active --quiet nass; then
  echo "==> Listo. NASS actualizado y funcionando."
else
  echo "==> El servicio no arrancó: journalctl -u nass -n 50 --no-pager" >&2
  exit 1
fi
