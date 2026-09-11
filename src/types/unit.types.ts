import type { GeoPoint, QuibdoZone } from "./incident.types";

/** Institución a la que pertenece la unidad de respuesta. */
export type Institution = "policia" | "ambulancia" | "bomberos" | "seguridad";

export type UnitAvailability =
  | "disponible"
  | "despachada"
  | "en_camino"
  | "en_sitio"
  | "ocupada"
  | "fuera_servicio";

export interface Unit {
  id: string;
  /** Indicativo de radio: POL-034, AMB-012, BOM-004 */
  callsign: string;
  name: string;
  institution: Institution;
  availability: UnitAvailability;
  currentLocation: GeoPoint;
  /** Rumbo en grados y velocidad en km/h reportados por el GPS. */
  heading?: number;
  speed?: number;
  accuracy?: number;
  zone: QuibdoZone;
  assignedIncidentId?: string;
  crew: number;
  lastUpdated: string;
  /** Falso cuando la unidad perdió conectividad y no reporta posición. */
  online: boolean;
}

export interface UnitLocationPing {
  unitId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
}
