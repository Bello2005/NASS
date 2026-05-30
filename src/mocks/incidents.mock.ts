import type { Incident, IncidentStatus, IncidentSeverity, IncidentCategory, QuibdoZone } from "@/types/incident.types";

const zones: QuibdoZone[] = ["Centro", "Cristo Rey", "Huapango", "San Vicente", "Kennedy", "La Yesca", "Chambacú"];
const categories: IncidentCategory[] = ["robo", "agresion", "accidente", "incendio", "disturbio", "hurto", "otro"];
const statuses: IncidentStatus[] = ["nueva", "aceptada", "en_camino", "atendiendo", "cerrada", "cancelada"];

const zoneCoords: Record<QuibdoZone, [number, number]> = {
  Centro:        [5.6942, -76.6601],
  "Cristo Rey":  [5.6870, -76.6520],
  Huapango:      [5.7010, -76.6480],
  "San Vicente": [5.6880, -76.6700],
  Kennedy:       [5.6960, -76.6640],
  "La Yesca":    [5.6830, -76.6560],
  Chambacú:      [5.7050, -76.6550],
};

const zoneAddresses: Record<QuibdoZone, string[]> = {
  Centro:        ["Cra 4 #26-18", "Cl 27 #3-45", "Av. 20 de Julio #25-10"],
  "Cristo Rey":  ["Cra 7 #15-20", "Cl 12 #6-30"],
  Huapango:      ["Cra 2 #32-15", "Cl 35 #1-08"],
  "San Vicente": ["Cra 10 #18-40", "Cl 20 #9-12"],
  Kennedy:       ["Cra 5 #28-55", "Cl 30 #4-22"],
  "La Yesca":    ["Cra 9 #11-08", "Cl 10 #8-17"],
  Chambacú:      ["Cra 1 #38-60", "Cl 40 #2-33"],
};

const titles: Record<IncidentCategory, string[]> = {
  robo:     ["Robo a mano armada", "Raponazo en vía pública", "Hurto a establecimiento comercial"],
  agresion: ["Agresión con arma blanca", "Riña entre particulares", "Violencia intrafamiliar"],
  accidente:["Accidente de tránsito", "Colisión vehicular", "Atropello en vía"],
  incendio: ["Incendio estructural", "Amago de incendio", "Incendio en bodega"],
  disturbio:["Disturbio en vía pública", "Manifestación no autorizada", "Alteración del orden"],
  hurto:    ["Hurto de motocicleta", "Hurto de celular", "Hurto a peatón"],
  otro:     ["Persona extraviada", "Emergencia médica en vía", "Animal agresivo reportado"],
};

const descriptions: Record<IncidentCategory, string> = {
  robo:     "Ciudadano reporta sustracción de pertenencias por individuos armados.",
  agresion: "Se reportan lesiones personales, se requiere atención médica.",
  accidente:"Vehículos involucrados, posibles heridos en la escena.",
  incendio: "Estructura en llamas, se requiere bomberos urgente.",
  disturbio:"Alteración del orden público con múltiples personas implicadas.",
  hurto:    "Sustracción de bien mueble sin violencia directa.",
  otro:     "Situación de emergencia reportada por ciudadano.",
};

const actorNames = ["Carlos Mosquera", "Ana Palacios", "Luis Rentería", "María Córdoba", "Juan Moreno", "Sistema"];
const actorIds   = ["USR-001", "USR-002", "AGT-001", "AGT-002", "USR-003", "system"];

function buildTimeline(status: IncidentStatus, baseTime: string) {
  const base = new Date(baseTime).getTime();
  const events = [];
  const progression: IncidentStatus[] = ["nueva", "aceptada", "en_camino", "atendiendo", "cerrada"];
  const idx = progression.indexOf(status);
  const limit = idx === -1 ? 1 : idx + 1;
  for (let i = 0; i < limit; i++) {
    events.push({
      id: `TL-${Date.now()}-${i}`,
      timestamp: new Date(base + i * 7 * 60_000).toISOString(),
      status: progression[i],
      actorName: i === 0 ? "Sistema" : actorNames[i % actorNames.length],
      actorId:   i === 0 ? "system"  : actorIds[i % actorIds.length],
      note: i === 0 ? "Incidencia registrada" : i === limit - 1 ? "Última actualización de estado" : undefined,
    });
  }
  if (status === "cancelada") {
    events.push({
      id: `TL-${Date.now()}-cancel`,
      timestamp: new Date(base + 10 * 60_000).toISOString(),
      status: "cancelada" as IncidentStatus,
      actorName: "Carlos Mosquera",
      actorId: "USR-001",
      note: "Cancelada por el administrador",
    });
  }
  return events;
}

export const mockIncidents: Incident[] = [
  {
    id: "INC-2024-001",
    title: "Robo a mano armada en mercado central",
    description: "Ciudadano reporta sustracción de billetera por dos individuos armados con cuchillos. La víctima resultó con herida leve.",
    category: "robo", status: "atendiendo", severity: 4, zone: "Centro",
    location: { lat: 5.6942, lng: -76.6601 }, address: "Cra 4 #26-18, Quibdó",
    reportedAt: "2024-05-29T14:23:00Z", updatedAt: "2024-05-29T14:45:00Z",
    reportedByUserId: "USR-003", assignedAgentId: "AGT-002",
    timeline: [
      { id: "TL-001-1", timestamp: "2024-05-29T14:23:00Z", status: "nueva",      actorName: "Sistema",         actorId: "system",  note: "Incidencia registrada automáticamente" },
      { id: "TL-001-2", timestamp: "2024-05-29T14:27:00Z", status: "aceptada",   actorName: "Carlos Mosquera", actorId: "USR-001", note: "Aceptada por líder de turno" },
      { id: "TL-001-3", timestamp: "2024-05-29T14:31:00Z", status: "en_camino",  actorName: "Luis Rentería",   actorId: "AGT-001" },
      { id: "TL-001-4", timestamp: "2024-05-29T14:45:00Z", status: "atendiendo", actorName: "Luis Rentería",   actorId: "AGT-001", note: "En contacto con la víctima" },
    ],
  },
  {
    id: "INC-2024-002",
    title: "Accidente de tránsito con heridos",
    description: "Colisión entre motocicleta y vehículo particular. Dos personas heridas requieren atención médica urgente.",
    category: "accidente", status: "cerrada", severity: 3, zone: "Cristo Rey",
    location: { lat: 5.6870, lng: -76.6520 }, address: "Cra 7 #15-20, Quibdó",
    reportedAt: "2024-05-29T10:00:00Z", updatedAt: "2024-05-29T11:30:00Z", closedAt: "2024-05-29T11:30:00Z",
    reportedByUserId: "USR-002",
    timeline: [
      { id: "TL-002-1", timestamp: "2024-05-29T10:00:00Z", status: "nueva",      actorName: "Sistema",       actorId: "system",  note: "Incidencia registrada" },
      { id: "TL-002-2", timestamp: "2024-05-29T10:05:00Z", status: "aceptada",   actorName: "Ana Palacios",  actorId: "USR-002" },
      { id: "TL-002-3", timestamp: "2024-05-29T10:12:00Z", status: "en_camino",  actorName: "Ana Palacios",  actorId: "USR-002" },
      { id: "TL-002-4", timestamp: "2024-05-29T10:25:00Z", status: "atendiendo", actorName: "Ana Palacios",  actorId: "USR-002" },
      { id: "TL-002-5", timestamp: "2024-05-29T11:30:00Z", status: "cerrada",    actorName: "Ana Palacios",  actorId: "USR-002", note: "Situación controlada. Heridos trasladados al hospital" },
    ],
  },
  {
    id: "INC-2024-003",
    title: "Incendio estructural en vivienda",
    description: "Casa de dos pisos con fuego en primer nivel. Familia con niños reporta el siniestro. Bomberos activados.",
    category: "incendio", status: "en_camino", severity: 5, zone: "Huapango",
    location: { lat: 5.7010, lng: -76.6480 }, address: "Cra 2 #32-15, Quibdó",
    reportedAt: "2024-05-29T15:10:00Z", updatedAt: "2024-05-29T15:18:00Z",
    reportedByUserId: "USR-001", assignedAgentId: "AGT-003",
    timeline: [
      { id: "TL-003-1", timestamp: "2024-05-29T15:10:00Z", status: "nueva",     actorName: "Sistema",         actorId: "system",  note: "Incidencia crítica registrada" },
      { id: "TL-003-2", timestamp: "2024-05-29T15:13:00Z", status: "aceptada",  actorName: "Carlos Mosquera", actorId: "USR-001", note: "Prioridad máxima asignada" },
      { id: "TL-003-3", timestamp: "2024-05-29T15:18:00Z", status: "en_camino", actorName: "Juan Moreno",     actorId: "AGT-003" },
    ],
  },
  {
    id: "INC-2024-004",
    title: "Riña entre particulares con arma blanca",
    description: "Dos hombres en pelea con cuchillo. Un herido grave en el abdomen.",
    category: "agresion", status: "nueva", severity: 5, zone: "San Vicente",
    location: { lat: 5.6880, lng: -76.6700 }, address: "Cra 10 #18-40, Quibdó",
    reportedAt: "2024-05-29T16:02:00Z", updatedAt: "2024-05-29T16:02:00Z",
    reportedByUserId: "USR-004",
    timeline: [
      { id: "TL-004-1", timestamp: "2024-05-29T16:02:00Z", status: "nueva", actorName: "Sistema", actorId: "system", note: "Incidencia registrada — sin asignar" },
    ],
  },
  {
    id: "INC-2024-005",
    title: "Hurto de motocicleta en Kennedy",
    description: "Propietario reporta sustracción de moto Honda XR150 de color rojo, placa XBC-234.",
    category: "hurto", status: "aceptada", severity: 2, zone: "Kennedy",
    location: { lat: 5.6960, lng: -76.6640 }, address: "Cra 5 #28-55, Quibdó",
    reportedAt: "2024-05-29T09:15:00Z", updatedAt: "2024-05-29T09:25:00Z",
    reportedByUserId: "USR-002", assignedAgentId: "AGT-004",
    timeline: [
      { id: "TL-005-1", timestamp: "2024-05-29T09:15:00Z", status: "nueva",    actorName: "Sistema",      actorId: "system" },
      { id: "TL-005-2", timestamp: "2024-05-29T09:25:00Z", status: "aceptada", actorName: "Ana Palacios", actorId: "USR-002" },
    ],
  },
  {
    id: "INC-2024-006",
    title: "Disturbio en vía pública — La Yesca",
    description: "Grupo de 15 personas alterando el orden frente a la cancha de fútbol. Bebidas embriagantes.",
    category: "disturbio", status: "cerrada", severity: 2, zone: "La Yesca",
    location: { lat: 5.6830, lng: -76.6560 }, address: "Cra 9 #11-08, Quibdó",
    reportedAt: "2024-05-28T21:30:00Z", updatedAt: "2024-05-28T23:00:00Z", closedAt: "2024-05-28T23:00:00Z",
    reportedByUserId: "USR-003",
    timeline: [
      { id: "TL-006-1", timestamp: "2024-05-28T21:30:00Z", status: "nueva",      actorName: "Sistema",       actorId: "system" },
      { id: "TL-006-2", timestamp: "2024-05-28T21:35:00Z", status: "aceptada",   actorName: "Juan Moreno",   actorId: "USR-005" },
      { id: "TL-006-3", timestamp: "2024-05-28T21:45:00Z", status: "en_camino",  actorName: "Juan Moreno",   actorId: "USR-005" },
      { id: "TL-006-4", timestamp: "2024-05-28T22:00:00Z", status: "atendiendo", actorName: "Juan Moreno",   actorId: "USR-005" },
      { id: "TL-006-5", timestamp: "2024-05-28T23:00:00Z", status: "cerrada",    actorName: "Juan Moreno",   actorId: "USR-005", note: "Personas dispersadas. Orden restablecido" },
    ],
  },
  {
    id: "INC-2024-007",
    title: "Raponazo en avenida principal",
    description: "Menor de edad arranca cadena de oro a transeúnte y huye en bicicleta.",
    category: "robo", status: "nueva", severity: 2, zone: "Centro",
    location: { lat: 5.6938, lng: -76.6590 }, address: "Av. 20 de Julio #25-10, Quibdó",
    reportedAt: "2024-05-29T16:45:00Z", updatedAt: "2024-05-29T16:45:00Z",
    reportedByUserId: "USR-004",
    timeline: [
      { id: "TL-007-1", timestamp: "2024-05-29T16:45:00Z", status: "nueva", actorName: "Sistema", actorId: "system" },
    ],
  },
  {
    id: "INC-2024-008",
    title: "Persona extraviada — adulto mayor",
    description: "Familia reporta adulto mayor de 78 años con Alzheimer desaparecido desde las 6am.",
    category: "otro", status: "atendiendo", severity: 4, zone: "Chambacú",
    location: { lat: 5.7050, lng: -76.6550 }, address: "Cra 1 #38-60, Quibdó",
    reportedAt: "2024-05-29T11:00:00Z", updatedAt: "2024-05-29T13:30:00Z",
    reportedByUserId: "USR-001", assignedAgentId: "AGT-005",
    timeline: [
      { id: "TL-008-1", timestamp: "2024-05-29T11:00:00Z", status: "nueva",      actorName: "Sistema",         actorId: "system" },
      { id: "TL-008-2", timestamp: "2024-05-29T11:08:00Z", status: "aceptada",   actorName: "Carlos Mosquera", actorId: "USR-001" },
      { id: "TL-008-3", timestamp: "2024-05-29T11:20:00Z", status: "en_camino",  actorName: "María Córdoba",   actorId: "AGT-005" },
      { id: "TL-008-4", timestamp: "2024-05-29T13:30:00Z", status: "atendiendo", actorName: "María Córdoba",   actorId: "AGT-005", note: "Persona localizada. Coordinando retorno con familia" },
    ],
  },
  {
    id: "INC-2024-009",
    title: "Violencia intrafamiliar con lesiones",
    description: "Mujer reporta agresión física por parte de su conviviente. Marcas visibles de golpes.",
    category: "agresion", status: "cerrada", severity: 4, zone: "Cristo Rey",
    location: { lat: 5.6865, lng: -76.6515 }, address: "Cl 12 #6-30, Quibdó",
    reportedAt: "2024-05-28T18:00:00Z", updatedAt: "2024-05-28T20:00:00Z", closedAt: "2024-05-28T20:00:00Z",
    reportedByUserId: "USR-002",
    timeline: [
      { id: "TL-009-1", timestamp: "2024-05-28T18:00:00Z", status: "nueva",      actorName: "Sistema",     actorId: "system" },
      { id: "TL-009-2", timestamp: "2024-05-28T18:05:00Z", status: "aceptada",   actorName: "Ana Palacios",actorId: "USR-002" },
      { id: "TL-009-3", timestamp: "2024-05-28T18:15:00Z", status: "en_camino",  actorName: "Ana Palacios",actorId: "USR-002" },
      { id: "TL-009-4", timestamp: "2024-05-28T18:30:00Z", status: "atendiendo", actorName: "Ana Palacios",actorId: "USR-002" },
      { id: "TL-009-5", timestamp: "2024-05-28T20:00:00Z", status: "cerrada",    actorName: "Ana Palacios",actorId: "USR-002", note: "Víctima trasladada a albergue. Agresor capturado" },
    ],
  },
  {
    id: "INC-2024-010",
    title: "Emergencia médica en vía pública",
    description: "Hombre en aparente estado de crisis epiléptica. Inconsciente en acera.",
    category: "otro", status: "cerrada", severity: 3, zone: "Kennedy",
    location: { lat: 5.6965, lng: -76.6648 }, address: "Cl 30 #4-22, Quibdó",
    reportedAt: "2024-05-29T08:30:00Z", updatedAt: "2024-05-29T09:00:00Z", closedAt: "2024-05-29T09:00:00Z",
    reportedByUserId: "USR-003",
    timeline: [
      { id: "TL-010-1", timestamp: "2024-05-29T08:30:00Z", status: "nueva",      actorName: "Sistema",       actorId: "system" },
      { id: "TL-010-2", timestamp: "2024-05-29T08:33:00Z", status: "aceptada",   actorName: "Juan Moreno",   actorId: "USR-005" },
      { id: "TL-010-3", timestamp: "2024-05-29T08:40:00Z", status: "en_camino",  actorName: "Juan Moreno",   actorId: "USR-005" },
      { id: "TL-010-4", timestamp: "2024-05-29T08:48:00Z", status: "atendiendo", actorName: "Juan Moreno",   actorId: "USR-005" },
      { id: "TL-010-5", timestamp: "2024-05-29T09:00:00Z", status: "cerrada",    actorName: "Juan Moreno",   actorId: "USR-005", note: "Ambulancia llegó. Paciente estabilizado" },
    ],
  },
  // Generated incidents
  ...Array.from({ length: 20 }, (_, i) => {
    const idx = i + 11;
    const zone = zones[i % zones.length];
    const category = categories[i % categories.length];
    const status = statuses[i % 5] as IncidentStatus; // skip cancelada for variety
    const severity = ((i % 5) + 1) as IncidentSeverity;
    const [baseLat, baseLng] = zoneCoords[zone];
    const addresses = zoneAddresses[zone];
    const titleList = titles[category];
    const day  = String((i % 28) + 1).padStart(2, "0");
    const hour = String((i % 12) + 7).padStart(2, "0");
    const baseDate = new Date(`2024-05-${day}T${hour}:00:00Z`);
    return {
      id: `INC-2024-0${idx}`,
      title: titleList[i % titleList.length],
      description: descriptions[category],
      category,
      status,
      severity,
      zone,
      location: { lat: baseLat + (i * 0.0003), lng: baseLng + (i * 0.0002) },
      address: `${addresses[i % addresses.length]}, Quibdó`,
      reportedAt: baseDate.toISOString(),
      updatedAt: new Date(baseDate.getTime() + 30 * 60_000).toISOString(),
      closedAt: status === "cerrada" ? new Date(baseDate.getTime() + 90 * 60_000).toISOString() : undefined,
      reportedByUserId: `USR-00${(i % 4) + 1}`,
      assignedAgentId: ["aceptada","en_camino","atendiendo","cerrada"].includes(status) ? `AGT-00${(i % 5) + 1}` : undefined,
      timeline: buildTimeline(status, baseDate.toISOString()).map((e, j) => ({ ...e, id: `TL-${idx}-${j}` })),
    };
  }),
];
