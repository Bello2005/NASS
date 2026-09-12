/**
 * Configuración de PM2 para NASS Ciudadano.
 *
 * Se usa PM2 porque es la convención del servidor de despliegue; si el servidor
 * no lo tiene, install.sh recurre al servicio systemd de deploy/nass.service.
 */
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = process.env.NASS_DIR || "/opt/nass";
const PUERTO = process.env.NASS_PORT || "3100";

/**
 * Next carga .env.local por su cuenta al arrancar, pero se pasa también aquí
 * de forma explícita: si NASS_AUTH_SECRET faltara, las sesiones se caerían de
 * forma intermitente y sin mensaje de error.
 */
function leerEnv() {
  const archivo = path.join(RAIZ, ".env.local");
  if (!fs.existsSync(archivo)) return {};
  return Object.fromEntries(
    fs.readFileSync(archivo, "utf8")
      .split("\n")
      .map((linea) => linea.trim())
      .filter((linea) => linea && !linea.startsWith("#") && linea.includes("="))
      .map((linea) => {
        const corte = linea.indexOf("=");
        return [linea.slice(0, corte).trim(), linea.slice(corte + 1).trim()];
      }),
  );
}

module.exports = {
  apps: [
    {
      name: "nass",
      cwd: RAIZ,
      script: "node_modules/next/dist/bin/next",
      // Solo escucha en local: nginx es la única puerta de entrada.
      args: `start -H 127.0.0.1 -p ${PUERTO}`,
      instances: 1,
      // El almacén, el canal de eventos y el simulador viven en el proceso:
      // más de una instancia partiría el estado en dos.
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: { NODE_ENV: "production", ...leerEnv() },
      merge_logs: true,
      time: true,
    },
  ],
};
