#!/usr/bin/env bash
#
# Instalación de NASS Ciudadano en un servidor Ubuntu o Debian.
#
#   bash install.sh nass.midominio.com correo@midominio.com
#
# Pensado para convivir con otros sitios en el mismo servidor:
#   · No reinstala Node si ya hay una versión 20 o superior.
#   · Elige un puerto libre en lugar de asumir el 3000.
#   · No elimina ni modifica ninguna configuración de nginx existente.
#   · Usa PM2 si el servidor ya lo tiene; si no, instala un servicio systemd.
#
# Es idempotente: la primera pasada se detiene para que escribas la clave de
# CARTO; la segunda termina la instalación.
#
set -euo pipefail

DOMINIO="${1:-}"
CORREO="${2:-}"
REPO="${NASS_REPO:-https://github.com/Bello2005/NASS.git}"
RAMA="${NASS_BRANCH:-claude/nice-archimedes-3l6hid}"
DESTINO="${NASS_DIR:-/opt/nass}"

rojo()  { printf '\033[0;31m%s\033[0m\n' "$*"; }
verde() { printf '\033[0;32m%s\033[0m\n' "$*"; }
paso()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

if [[ -z "$DOMINIO" || -z "$CORREO" ]]; then
  rojo "Uso: bash install.sh <subdominio> <correo>"
  exit 1
fi
if [[ "$(id -u)" -ne 0 ]]; then
  rojo "Ejecuta este script como root."
  exit 1
fi

paso "1/7 · Comprobando el servidor"
export DEBIAN_FRONTEND=noninteractive

# Node: solo se instala si falta o es anterior a la 20, que es lo que pide
# Next 16. En un servidor con otras aplicaciones, subir Node a lo bruto puede
# romperlas.
if command -v node >/dev/null 2>&1 && [[ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -ge 20 ]]; then
  verde "    Node $(node -v) ya instalado · no se toca"
else
  verde "    instalando Node 22"
  apt-get update -qq
  apt-get install -y -qq curl ca-certificates >/dev/null
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi

for prog in git nginx openssl; do
  command -v "$prog" >/dev/null 2>&1 || { apt-get update -qq; apt-get install -y -qq "$prog" >/dev/null; }
done

# Puerto libre a partir del 3100: el 3000 suele estar ocupado.
PUERTO="${NASS_PORT:-}"
if [[ -z "$PUERTO" ]]; then
  for p in $(seq 3100 3199); do
    if ! ss -ltn 2>/dev/null | grep -q ":${p}\b"; then PUERTO="$p"; break; fi
  done
fi
[[ -n "$PUERTO" ]] || { rojo "No hay puertos libres entre 3100 y 3199."; exit 1; }
verde "    puerto $PUERTO libre · la aplicación escuchará solo en 127.0.0.1:$PUERTO"

if command -v pm2 >/dev/null 2>&1; then
  GESTOR=pm2
  verde "    PM2 detectado · se usará PM2, la convención de este servidor"
else
  GESTOR=systemd
  verde "    sin PM2 · se instalará un servicio systemd"
fi

paso "2/7 · Código fuente en $DESTINO"
if [[ -d "$DESTINO/.git" ]]; then
  git -C "$DESTINO" fetch --depth 1 origin "$RAMA"
  git -C "$DESTINO" reset --hard "origin/$RAMA"
  verde "    actualizado a lo último de $RAMA"
else
  git clone --depth 1 --branch "$RAMA" "$REPO" "$DESTINO"
  verde "    clonado $RAMA"
fi

paso "3/7 · Configuración"
ENV_FILE="$DESTINO/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" <<ENV
# Clave de los basemaps de CARTO. Se incrusta al compilar: si la cambias,
# hay que volver a compilar (bash deploy/update.sh).
NEXT_PUBLIC_CARTO_API_KEY=
NEXT_PUBLIC_CARTO_STYLE=dark_all

# Secreto de firma de sesiones, generado para este servidor.
NASS_AUTH_SECRET=$(openssl rand -hex 32)

NASS_SIMULATOR=on
NASS_SIM_SPEED_KMH=55
ENV
  chmod 600 "$ENV_FILE"
  verde "    creado $ENV_FILE con un secreto de sesión nuevo"
else
  verde "    $ENV_FILE ya existe · se conserva"
fi

CLAVE_CARTO="$(sed -n 's/^NEXT_PUBLIC_CARTO_API_KEY=//p' "$ENV_FILE" | head -1)"
# Se rechazan también los marcadores de las instrucciones: es fácil pegar el
# comando de ejemplo sin sustituirlos, y el valor se incrusta al compilar.
case "${CLAVE_CARTO^^}" in
  ""|TU_CLAVE|PEGA_AQUI|TU_KEY|YOUR_KEY|CLAVE|XXX*)
    echo
    rojo "La clave de CARTO falta o sigue siendo un marcador de ejemplo:"
    rojo "    NEXT_PUBLIC_CARTO_API_KEY=${CLAVE_CARTO:-(vacío)}"
    echo
    echo "  Ponla con tu clave real (reemplaza SOLO la parte final):"
    echo
    echo "    sed -i 's|^NEXT_PUBLIC_CARTO_API_KEY=.*|NEXT_PUBLIC_CARTO_API_KEY=mi_clave_real|' $ENV_FILE"
    echo
    echo "  Y vuelve a ejecutar este mismo comando."
    echo
    echo "Sin clave válida el sistema funciona, pero el mapa sale con la marca"
    echo "de agua 'API KEY REQUIRED' encima. Se obtiene en https://carto.com/"
    exit 1
    ;;
esac
verde "    clave de CARTO presente"

paso "4/7 · Compilando (tarda unos minutos)"
cd "$DESTINO"
npm ci --no-audit --no-fund
npm run build
verde "    compilado"

paso "5/7 · Arrancando la aplicación"
if [[ "$GESTOR" == "pm2" ]]; then
  # delete antes de start para que un cambio de puerto se aplique de verdad.
  pm2 delete nass >/dev/null 2>&1 || true
  NASS_DIR="$DESTINO" NASS_PORT="$PUERTO" pm2 start "$DESTINO/deploy/ecosystem.config.cjs"
  pm2 save >/dev/null
  verde "    corriendo bajo PM2 y guardado para el arranque"
else
  sed "s/NASS_PORT=3100/NASS_PORT=$PUERTO/" "$DESTINO/deploy/nass.service" > /etc/systemd/system/nass.service
  systemctl daemon-reload
  systemctl enable nass >/dev/null 2>&1
  systemctl restart nass
  verde "    corriendo bajo systemd y habilitado en el arranque"
fi

sleep 4
if ! curl -sf -o /dev/null "http://127.0.0.1:$PUERTO/entrar"; then
  rojo "    la aplicación no responde en 127.0.0.1:$PUERTO"
  [[ "$GESTOR" == "pm2" ]] && rojo "    revisa: pm2 logs nass --lines 50" \
                           || rojo "    revisa: journalctl -u nass -n 50 --no-pager"
  exit 1
fi
verde "    responde correctamente"

paso "6/7 · Dominio en nginx"
# Se añade un sitio nuevo. No se toca ni se elimina ninguno existente.
SITIO=/etc/nginx/sites-available/nass.conf
sed -e "s/__DOMINIO__/$DOMINIO/g" -e "s/__PUERTO__/$PUERTO/g" \
  "$DESTINO/deploy/nginx-nass.conf" > "$SITIO"
ln -sf "$SITIO" /etc/nginx/sites-enabled/nass.conf
if ! nginx -t 2>/dev/null; then
  rojo "    nginx rechazó la configuración. Se retira para no afectar a los demás sitios."
  rm -f /etc/nginx/sites-enabled/nass.conf
  nginx -t
  exit 1
fi
systemctl reload nginx
verde "    nginx sirviendo $DOMINIO (los demás sitios intactos)"

paso "7/7 · Certificado TLS"
# El botón de pánico necesita HTTPS: navigator.geolocation solo funciona en
# contexto seguro. Sin certificado, el celular no entrega el GPS.
command -v certbot >/dev/null 2>&1 || apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
if certbot --nginx -d "$DOMINIO" --non-interactive --agree-tos -m "$CORREO" --redirect; then
  verde "    certificado instalado"
else
  rojo "    certbot falló. Comprueba que el DNS de $DOMINIO apunte a este servidor."
  rojo "    SIN HTTPS el botón de pánico no podrá leer el GPS del celular."
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
if [[ "$GESTOR" == "pm2" ]]; then
echo "  Estado:     pm2 status nass"
echo "  Registro:   pm2 logs nass"
else
echo "  Estado:     systemctl status nass"
echo "  Registro:   journalctl -u nass -f"
fi
echo "  Actualizar: bash $DESTINO/deploy/update.sh"
echo
echo "  Puerto interno: 127.0.0.1:$PUERTO (no expuesto al exterior)"
echo "  Los datos viven en memoria: reiniciar devuelve los datos demo."
echo
