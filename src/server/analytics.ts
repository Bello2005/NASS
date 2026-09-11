import { getDb, listUnits } from "./db";
import type { Incident, IncidentCategory, IncidentPriority, IncidentStatus, QuibdoZone } from "@/types/incident.types";

export interface AnalyticsFilters {
  days: number;
  category?: IncidentCategory;
  zone?: QuibdoZone;
  priority?: IncidentPriority;
}

const minutesBetween = (from?: string, to?: string): number | undefined => {
  if (!from || !to) return undefined;
  const diff = (Date.parse(to) - Date.parse(from)) / 60_000;
  return Number.isFinite(diff) && diff >= 0 ? diff : undefined;
};

const average = (values: number[]): number =>
  values.length === 0 ? 0 : Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;

export function filterIncidents(filters: AnalyticsFilters): Incident[] {
  const since = Date.now() - filters.days * 24 * 3600_000;
  return getDb().incidents.filter((incident) => {
    if (Date.parse(incident.reportedAt) < since) return false;
    if (filters.category && incident.category !== filters.category) return false;
    if (filters.zone && incident.zone !== filters.zone) return false;
    if (filters.priority && incident.priority !== filters.priority) return false;
    return true;
  });
}

export function buildSummary(filters: AnalyticsFilters) {
  const incidents = filterIncidents(filters);
  const units = listUnits();
  const closed = incidents.filter((i) => i.status === "cerrada");
  const active = incidents.filter((i) => i.status !== "cerrada" && i.status !== "cancelada");

  const responseMinutes = incidents
    .map((i) => minutesBetween(i.reportedAt, i.acknowledgedAt))
    .filter((v): v is number => v !== undefined);
  const dispatchMinutes = incidents
    .map((i) => minutesBetween(i.acknowledgedAt, i.dispatchedAt))
    .filter((v): v is number => v !== undefined);
  const arrivalMinutes = incidents
    .map((i) => minutesBetween(i.dispatchedAt, i.arrivedAt))
    .filter((v): v is number => v !== undefined);

  const byCategory = new Map<string, number>();
  const byZone = new Map<string, number>();
  const byStatus = new Map<string, number>();
  const byPriority = new Map<string, number>();
  const byHour = Array.from({ length: 24 }, () => 0);
  /** Matriz día de la semana × hora para el mapa de calor temporal. */
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));

  for (const incident of incidents) {
    byCategory.set(incident.category, (byCategory.get(incident.category) ?? 0) + 1);
    byZone.set(incident.zone, (byZone.get(incident.zone) ?? 0) + 1);
    byStatus.set(incident.status, (byStatus.get(incident.status) ?? 0) + 1);
    byPriority.set(incident.priority, (byPriority.get(incident.priority) ?? 0) + 1);
    const date = new Date(incident.reportedAt);
    byHour[date.getHours()] += 1;
    grid[date.getDay()][date.getHours()] += 1;
  }

  // Serie diaria: nuevas, cerradas y críticas.
  const series: Array<{ date: string; label: string; nuevas: number; cerradas: number; criticas: number }> = [];
  for (let offset = filters.days - 1; offset >= 0; offset--) {
    const day = new Date(Date.now() - offset * 24 * 3600_000);
    const key = day.toISOString().slice(0, 10);
    const dayIncidents = incidents.filter((i) => i.reportedAt.slice(0, 10) === key);
    series.push({
      date: key,
      label: day.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
      nuevas: dayIncidents.length,
      cerradas: incidents.filter((i) => i.closedAt?.slice(0, 10) === key).length,
      criticas: dayIncidents.filter((i) => i.priority === "critica").length,
    });
  }

  const resolvable = incidents.filter((i) => i.status !== "cancelada").length;

  return {
    range: { days: filters.days },
    kpis: {
      activos: active.length,
      atendidos: closed.length,
      totalPeriodo: incidents.length,
      tiempoRespuestaMin: average(responseMinutes),
      tiempoDespachoMin: average(dispatchMinutes),
      tiempoLlegadaMin: average(arrivalMinutes),
      unidadesDisponibles: units.filter((u) => u.availability === "disponible").length,
      unidadesOcupadas: units.filter((u) => !["disponible", "fuera_servicio"].includes(u.availability)).length,
      unidadesTotal: units.length,
      tasaResolucion: resolvable === 0 ? 0 : Math.round((closed.length / resolvable) * 1000) / 10,
      criticasActivas: active.filter((i) => i.priority === "critica").length,
    },
    series,
    byHour: byHour.map((count, hour) => ({ hour, count })),
    byCategory: [...byCategory.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    byZone: [...byZone.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    byStatus: [...byStatus.entries()].map(([key, count]) => ({ key: key as IncidentStatus, count })),
    byPriority: [...byPriority.entries()].map(([key, count]) => ({ key, count })),
    grid,
  };
}

/**
 * Puntos para el mapa de calor geográfico.
 * Se agregan en una rejilla de ~150 m para no exponer la ubicación exacta
 * de un ciudadano en la vista analítica (§24 privacidad).
 */
export function buildHeatmap(filters: AnalyticsFilters) {
  const CELL = 0.0015; // ≈ 165 m
  const cells = new Map<string, { lat: number; lng: number; weight: number }>();

  for (const incident of filterIncidents(filters)) {
    const lat = Math.round(incident.location.lat / CELL) * CELL;
    const lng = Math.round(incident.location.lng / CELL) * CELL;
    const key = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
    const cell = cells.get(key);
    if (cell) cell.weight += 1;
    else cells.set(key, { lat, lng, weight: 1 });
  }

  const points = [...cells.values()].sort((a, b) => b.weight - a.weight);
  return { points, max: points[0]?.weight ?? 0, total: points.reduce((sum, p) => sum + p.weight, 0) };
}
