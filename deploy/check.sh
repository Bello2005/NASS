#!/usr/bin/env bash
#
# Verificación de un despliegue de NASS. No modifica nada.
#
#   bash /opt/nass/deploy/check.sh nass.midominio.com
#
set -uo pipefail

DOMINIO="${1:-}"
DESTINO="${NASS_DIR:-/opt/nass}"
FALLOS=0

ok()   { printf '  \033[0;32m✓\033[0m %s\n' "$*"; }
mal()  { printf '  \033[0;31m✗\033[0m %s\n' "$*"; FALLOS=$((FALLOS+1)); }
avis() { printf '  \033[0;33m!\033[0m %s\n' "$*"; }
tit()  { printf '\n\033[1;34m%s\033[0m\n' "$*"; }

[[ -n "$DOMINIO" ]] || { echo "Uso: bash check.sh <dominio>"; exit 1; }

tit "Proceso"
if command -v pm2 >/dev/null 2>&1 && pm2 describe nass >/dev/null 2>&1; then
  ESTADO="$(pm2 jlist 2>/dev/null | grep -o '"name":"nass".*' | grep -o '"status":"[a-z]*"' | head -1 | cut -d'"' -f4)"
  [[ "$ESTADO" == "online" ]] && ok "PM2: nass en línea" || mal "PM2: nass está '$ESTADO'"
elif systemctl is-active --quiet nass 2>/dev/null; then
  ok "systemd: nass activo"
else
  mal "la aplicación no está corriendo"
fi

# Puerto interno, leído de la configuración de nginx para no suponerlo.
PUERTO="$(grep -oP 'proxy_pass http://127\.0\.0\.1:\K[0-9]+' /etc/nginx/sites-enabled/nass.conf 2>/dev/null | head -1)"
PUERTO="${PUERTO:-3100}"

tit "Aplicación en local (127.0.0.1:$PUERTO)"
curl -sf -o /dev/null "http://127.0.0.1:$PUERTO/entrar" \
  && ok "responde la pantalla de acceso" || mal "no responde en el puerto interno"

# No debe aceptar conexiones fuera de local: nginx es la única puerta.
IP_PUB="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [[ -n "$IP_PUB" ]]; then
  if timeout 4 curl -sf -o /dev/null "http://$IP_PUB:$PUERTO/entrar" 2>/dev/null; then
    mal "el puerto $PUERTO acepta conexiones en $IP_PUB (debería ser solo local)"
  else
    ok "el puerto $PUERTO no está expuesto al exterior"
  fi
fi

tit "Clave del mapa"
# La clave se incrusta al compilar, así que no basta con mirar .env.local:
# hay que confirmar que ese mismo valor esté dentro del paquete. Nunca se
# imprime la clave, solo el veredicto.
CLAVE="$(sed -n 's/^NEXT_PUBLIC_CARTO_API_KEY=//p' "$DESTINO/.env.local" 2>/dev/null | head -1)"
CHUNKS="$DESTINO/.next/static/chunks"
if [[ ! -d "$CHUNKS" ]]; then
  mal "no existe el paquete compilado en $CHUNKS"
elif [[ -z "$CLAVE" ]]; then
  avis "sin clave en .env.local: el mapa saldrá con la marca de agua de CARTO"
elif [[ "${CLAVE^^}" =~ ^(TU_CLAVE|PEGA_AQUI|TU_KEY|YOUR_KEY|CLAVE)$ ]]; then
  mal "la clave es un marcador de ejemplo, no una clave real: el mapa saldrá con marca de agua"
elif grep -rqsF "$CLAVE" "$CHUNKS"; then
  ok "la clave de .env.local está incrustada en el paquete"
else
  mal "la clave de .env.local NO está en el paquete: falta recompilar (bash deploy/update.sh)"
fi

tit "HTTPS en $DOMINIO"
COD="$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMINIO/entrar" 2>/dev/null)"
[[ "$COD" == "200" ]] && ok "https responde 200" || mal "https devolvió $COD"

VENCE="$(echo | openssl s_client -connect "$DOMINIO:443" -servername "$DOMINIO" 2>/dev/null \
  | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)"
[[ -n "$VENCE" ]] && ok "certificado válido hasta $VENCE" || mal "no se pudo leer el certificado"

curl -s -o /dev/null -w '%{http_code}' "http://$DOMINIO/entrar" 2>/dev/null | grep -q '30[18]' \
  && ok "http redirige a https" || avis "http no redirige (revisa la redirección de certbot)"

tit "Flujo de la API"
GALLETAS="$(mktemp)"
trap 'rm -f "$GALLETAS"' EXIT
LOGIN="$(curl -s -c "$GALLETAS" -X POST "https://$DOMINIO/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"operador@nass.gov.co","password":"nass2026"}' -w '\n%{http_code}')"
if [[ "$(tail -1 <<<"$LOGIN")" == "200" ]]; then
  ok "inicio de sesión del operador"
else
  mal "el inicio de sesión devolvió $(tail -1 <<<"$LOGIN")"
fi

CUENTA="$(curl -s -b "$GALLETAS" "https://$DOMINIO/api/incidents" | grep -o '"code":"NASS-' | wc -l)"
[[ "$CUENTA" -gt 0 ]] && ok "la API devuelve $CUENTA incidentes" || mal "la API no devolvió incidentes"

curl -s -b "$GALLETAS" "https://$DOMINIO/api/units" | grep -q '"callsign"' \
  && ok "la API devuelve las unidades" || mal "la API no devolvió unidades"

tit "Canal de eventos en tiempo real"
# Si nginx almacenara la respuesta en búfer, no llegaría nada en estos segundos.
BYTES="$(timeout 8 curl -s -N -b "$GALLETAS" -H 'Accept: text/event-stream' \
  "https://$DOMINIO/api/events" 2>/dev/null | head -c 400 | wc -c)"
if [[ "$BYTES" -gt 0 ]]; then
  ok "el canal transmite ($BYTES bytes en 8 s) · nginx no está cortándolo"
else
  mal "el canal no transmitió nada: revisa proxy_buffering en nginx"
fi

tit "Resultado"
if [[ "$FALLOS" -eq 0 ]]; then
  printf '  \033[0;32mTodo en orden.\033[0m https://%s\n\n' "$DOMINIO"
else
  printf '  \033[0;31m%s comprobación(es) fallaron.\033[0m\n' "$FALLOS"
  printf '  Registro: pm2 logs nass --lines 40\n\n'
  exit 1
fi
