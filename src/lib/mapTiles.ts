/**
 * Configuración compartida de las teselas del mapa.
 *
 * Los basemaps de CARTO requieren clave: sin ella las teselas salen con la
 * marca de agua "API KEY REQUIRED". La clave viaja al navegador —es inevitable
 * en un mapa del lado del cliente— así que se expone con el prefijo público y
 * se restringe por dominio desde el panel de CARTO, no ocultándola.
 *
 * PUNTO DE INTEGRACIÓN: para cambiar de proveedor (MapTiler, Mapbox, teselas
 * propias) basta reescribir este archivo; los cuatro mapas lo consumen.
 */

const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY ?? "";

/** Estilo de CARTO. `dark_all` es el que corresponde a la interfaz del C4. */
const CARTO_STYLE = process.env.NEXT_PUBLIC_CARTO_STYLE ?? "dark_all";

export const TILE_URL =
  `https://{s}.basemaps.cartocdn.com/${CARTO_STYLE}/{z}/{x}/{y}{r}.png` +
  (CARTO_KEY ? `?key=${CARTO_KEY}` : "");

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** CARTO sirve desde cuatro subdominios; Leaflet usa tres por defecto. */
export const TILE_SUBDOMAINS = "abcd";

export const TILE_MAX_ZOOM = 20;

/** Falso cuando falta la clave: el mapa funciona, pero sale con marca de agua. */
export const hasMapKey = CARTO_KEY.length > 0;
