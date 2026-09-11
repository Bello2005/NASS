import type { GeoPoint, QuibdoZone } from "@/types/incident.types";

export const QUIBDO_CENTER: GeoPoint = { lat: 5.6919, lng: -76.6583 };

export const ZONE_COORDS: Record<QuibdoZone, GeoPoint> = {
  Centro: { lat: 5.6942, lng: -76.6601 },
  "Cristo Rey": { lat: 5.687, lng: -76.652 },
  Huapango: { lat: 5.701, lng: -76.648 },
  "San Vicente": { lat: 5.688, lng: -76.67 },
  Kennedy: { lat: 5.696, lng: -76.6640 },
  "La Yesca": { lat: 5.683, lng: -76.6560 },
  Chambacú: { lat: 5.705, lng: -76.6550 },
};

export const ZONE_LIST = Object.keys(ZONE_COORDS) as QuibdoZone[];

const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Distancia en metros entre dos puntos (fórmula del haversine). */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Rumbo en grados (0 = norte) desde `from` hacia `to`. */
export function bearing(from: GeoPoint, to: GeoPoint): number {
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Avanza `meters` desde `from` en dirección a `to`, sin sobrepasar el destino. */
export function moveToward(from: GeoPoint, to: GeoPoint, meters: number): GeoPoint {
  const total = distanceMeters(from, to);
  if (total <= meters || total === 0) return { ...to };
  const fraction = meters / total;
  return {
    lat: from.lat + (to.lat - from.lat) * fraction,
    lng: from.lng + (to.lng - from.lng) * fraction,
  };
}

/** Zona más cercana a un punto — usada para clasificar alertas automáticamente. */
export function zoneForPoint(point: GeoPoint): QuibdoZone {
  let best: QuibdoZone = "Centro";
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const zone of ZONE_LIST) {
    const d = distanceMeters(point, ZONE_COORDS[zone]);
    if (d < bestDistance) {
      bestDistance = d;
      best = zone;
    }
  }
  return best;
}

/** Punto aleatorio dentro de un radio en metros — solo para datos de demostración. */
export function jitter(point: GeoPoint, radiusMeters: number): GeoPoint {
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusMeters;
  const dLat = (distance * Math.cos(angle)) / 111_320;
  const dLng = (distance * Math.sin(angle)) / (111_320 * Math.cos(toRad(point.lat)));
  return { lat: point.lat + dLat, lng: point.lng + dLng };
}
