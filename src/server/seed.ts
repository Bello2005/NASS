import { hashPassword, type PasswordHash } from "./auth";
import { jitter, ZONE_COORDS, ZONE_LIST } from "./geo";
import type {
  Incident,
  IncidentCategory,
  IncidentPriority,
  IncidentSeverity,
  IncidentStatus,
  QuibdoZone,
  TimelineEvent,
} from "@/types/incident.types";
import type { Institution, Unit } from "@/types/unit.types";
import type { User } from "@/types/user.types";

/** Contraseña compartida por todas las cuentas de demostración. */
export const DEMO_PASSWORD = "nass2026";

/** PRNG determinista: la demo se ve igual en cada arranque. */
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260911);
const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();

const PRIORITY_SEVERITY: Record<IncidentPriority, IncidentSeverity> = {
  critica: 5,
  alta: 4,
  media: 3,
  baja: 2,
};

const CATEGORY_PRIORITY: Partial<Record<IncidentCategory, IncidentPriority>> = {
  emergencia_medica: "critica",
  incendio: "critica",
  violencia: "alta",
  violencia_intrafamiliar: "alta",
  robo: "alta",
  accidente: "alta",
  amenaza: "alta",
  persona_desaparecida: "alta",
  hurto: "media",
  persona_sospechosa: "media",
  disturbio: "media",
  agresion: "alta",
  emergencia_ambiental: "media",
  riesgo_comunitario: "baja",
  otro: "baja",
};

const CATEGORY_TITLES: Partial<Record<IncidentCategory, string>> = {
  emergencia_medica: "Emergencia médica reportada",
  robo: "Robo con intimidación",
  hurto: "Hurto a persona",
  violencia: "Riña con lesionados",
  violencia_intrafamiliar: "Violencia intrafamiliar",
  persona_sospechosa: "Persona sospechosa en el sector",
  accidente: "Accidente de tránsito",
  incendio: "Conato de incendio",
  amenaza: "Amenaza directa",
  persona_desaparecida: "Persona desaparecida",
  emergencia_ambiental: "Emergencia ambiental",
  riesgo_comunitario: "Riesgo en vía pública",
  agresion: "Agresión física",
  disturbio: "Disturbio en espacio público",
  otro: "Reporte ciudadano",
};

const STREETS = [
  "Calle 24 con Carrera 5",
  "Carrera 1 # 20-14",
  "Avenida del Río, sector comercial",
  "Calle 31 con Carrera 8",
  "Barrio Niño Jesús, vía principal",
  "Calle 27 # 4-56",
  "Carrera 6 frente al parque",
  "Avenida Manuel Mosquera",
  "Calle 18 con Carrera 2",
  "Sector malecón, zona norte",
];

const CITIZEN_NAMES = [
  "Yeison Mosquera", "Luz Dary Palacios", "Wilmer Córdoba", "Yurany Rentería",
  "Deiner Asprilla", "Marlady Perea", "Jhon Fredy Moreno", "Sandra Copete",
  "Alexánder Murillo", "Yulieth Cuesta", "Óscar Ibargüen", "Diana Valoyes",
  "Brayan Lozano", "Kelly Mena", "Harold Chaverra", "Nury Palomeque",
  "Edinson Robledo", "Claudia Bejarano", "Fabián Salas", "Greisy Machado",
];

const STAFF: Array<{ name: string; email: string; role: User["role"]; zone?: QuibdoZone }> = [
  { name: "Carlos Mosquera", email: "admin@nass.gov.co", role: "super_admin" },
  { name: "Ana Palacios", email: "operador@nass.gov.co", role: "operador" },
  { name: "Jorge Valencia", email: "operador2@nass.gov.co", role: "operador" },
  { name: "Ricardo Hurtado", email: "supervisor@nass.gov.co", role: "supervisor" },
];

const UNIT_BLUEPRINT: Array<{
  callsign: string; name: string; institution: Institution; zone: QuibdoZone; crew: number;
}> = [
  { callsign: "POL-031", name: "Patrulla Centro 1", institution: "policia", zone: "Centro", crew: 2 },
  { callsign: "POL-034", name: "Patrulla Centro 2", institution: "policia", zone: "Kennedy", crew: 2 },
  { callsign: "POL-042", name: "Cuadrante Cristo Rey", institution: "policia", zone: "Cristo Rey", crew: 2 },
  { callsign: "POL-047", name: "Cuadrante San Vicente", institution: "policia", zone: "San Vicente", crew: 2 },
  { callsign: "AMB-011", name: "Ambulancia Medicalizada 1", institution: "ambulancia", zone: "Centro", crew: 3 },
  { callsign: "AMB-014", name: "Ambulancia Básica 2", institution: "ambulancia", zone: "Huapango", crew: 2 },
  { callsign: "AMB-019", name: "Ambulancia Básica 3", institution: "ambulancia", zone: "La Yesca", crew: 2 },
  { callsign: "BOM-004", name: "Máquina de Bomberos 1", institution: "bomberos", zone: "Centro", crew: 5 },
  { callsign: "BOM-007", name: "Unidad de Rescate", institution: "bomberos", zone: "Chambacú", crew: 4 },
  { callsign: "SEG-022", name: "Seguridad Privada Norte", institution: "seguridad", zone: "Huapango", crew: 2 },
];

export interface SeedResult {
  users: User[];
  credentials: Record<string, PasswordHash>;
  units: Unit[];
  incidents: Incident[];
  sequence: number;
}

export function buildSeed(now = new Date()): SeedResult {
  const users: User[] = [];
  const credentials: Record<string, PasswordHash> = {};
  const password = hashPassword(DEMO_PASSWORD);

  const addUser = (user: User) => {
    users.push(user);
    credentials[user.email.toLowerCase()] = password;
  };

  STAFF.forEach((person, index) => {
    addUser({
      id: `USR-${String(index + 1).padStart(3, "0")}`,
      name: person.name,
      email: person.email,
      role: person.role,
      status: "activo",
      phone: `+57 31${index} 555 01${String(index).padStart(2, "0")}`,
      createdAt: new Date(now.getTime() - 240 * 24 * 3600_000).toISOString(),
      lastLoginAt: new Date(now.getTime() - 3600_000).toISOString(),
      avatarInitials: initials(person.name),
    });
  });

  // --- Unidades de respuesta ---------------------------------------------
  const units: Unit[] = UNIT_BLUEPRINT.map((blueprint, index) => ({
    id: `UNI-${String(index + 1).padStart(3, "0")}`,
    callsign: blueprint.callsign,
    name: blueprint.name,
    institution: blueprint.institution,
    availability: "disponible",
    currentLocation: jitter(ZONE_COORDS[blueprint.zone], 450),
    heading: Math.floor(rand() * 360),
    speed: 0,
    accuracy: 8,
    zone: blueprint.zone,
    crew: blueprint.crew,
    lastUpdated: now.toISOString(),
    online: true,
  }));

  // Cada unidad tiene una cuenta para iniciar sesión desde el móvil.
  units.forEach((unit, index) => {
    addUser({
      id: `USR-U${String(index + 1).padStart(3, "0")}`,
      name: `${unit.callsign} · ${unit.name}`,
      email: `${unit.callsign.toLowerCase()}@nass.gov.co`,
      role: "unidad",
      status: "activo",
      zone: unit.zone,
      createdAt: new Date(now.getTime() - 180 * 24 * 3600_000).toISOString(),
      avatarInitials: unit.callsign.slice(0, 3),
      unitId: unit.id,
    });
  });

  // --- Ciudadanos ---------------------------------------------------------
  CITIZEN_NAMES.forEach((name, index) => {
    const zone = ZONE_LIST[index % ZONE_LIST.length];
    addUser({
      id: `USR-C${String(index + 1).padStart(3, "0")}`,
      name,
      email: `ciudadano${index + 1}@demo.nass.co`,
      role: "ciudadano",
      status: "activo",
      phone: `+57 3${10 + (index % 9)} 555 ${String(1000 + index)}`,
      zone,
      createdAt: new Date(now.getTime() - (30 + index) * 24 * 3600_000).toISOString(),
      avatarInitials: initials(name),
    });
  });
  // Cuenta destacada para la demostración en vivo.
  addUser({
    id: "USR-C000",
    name: "Ciudadano Demo",
    email: "ciudadano@demo.nass.co",
    role: "ciudadano",
    status: "activo",
    phone: "+57 300 000 0000",
    zone: "Centro",
    createdAt: new Date(now.getTime() - 60 * 24 * 3600_000).toISOString(),
    avatarInitials: "CD",
  });

  const citizens = users.filter((u) => u.role === "ciudadano");
  const operators = users.filter((u) => u.role === "operador");
  const categories = Object.keys(CATEGORY_PRIORITY) as IncidentCategory[];

  // --- Histórico de incidentes (30 días) ----------------------------------
  const incidents: Incident[] = [];
  let sequence = 0;

  const HISTORY_DAYS = 30;
  for (let day = HISTORY_DAYS; day >= 0; day--) {
    // Más incidentes los fines de semana y en días recientes.
    const date = new Date(now.getTime() - day * 24 * 3600_000);
    const weekend = date.getDay() === 5 || date.getDay() === 6;
    const count = Math.round(3 + rand() * 4 + (weekend ? 2 : 0));

    for (let i = 0; i < count; i++) {
      // Curva horaria realista: picos a media mañana y en la noche.
      const hourRoll = rand();
      const hour = hourRoll < 0.2 ? Math.floor(rand() * 7)
        : hourRoll < 0.55 ? 8 + Math.floor(rand() * 6)
        : 17 + Math.floor(rand() * 7);
      const reportedAt = new Date(date);
      reportedAt.setHours(hour, Math.floor(rand() * 60), Math.floor(rand() * 60), 0);
      if (reportedAt.getTime() > now.getTime()) continue;

      const category = pick(categories);
      const priority = CATEGORY_PRIORITY[category] ?? "media";
      const zone = pick(ZONE_LIST);
      const citizen = pick(citizens);
      const operator = pick(operators);
      const unit = pick(units);

      sequence += 1;
      const id = `INC-${String(sequence).padStart(6, "0")}`;
      const ackSeconds = 20 + Math.floor(rand() * 90);
      const dispatchSeconds = ackSeconds + 30 + Math.floor(rand() * 120);
      const arriveSeconds = dispatchSeconds + 240 + Math.floor(rand() * 600);
      const closeSeconds = arriveSeconds + 600 + Math.floor(rand() * 1800);

      const at = (seconds: number) => new Date(reportedAt.getTime() + seconds * 1000).toISOString();
      const cancelled = rand() < 0.06;
      const status: IncidentStatus = cancelled ? "cancelada" : "cerrada";

      const timeline: TimelineEvent[] = [
        { id: `${id}-T1`, timestamp: reportedAt.toISOString(), status: "nueva", actorId: citizen.id, actorName: citizen.name, note: "Alerta generada por el ciudadano" },
      ];
      if (!cancelled) {
        timeline.push(
          { id: `${id}-T2`, timestamp: at(ackSeconds), status: "recibida", actorId: operator.id, actorName: operator.name, note: "Alerta tomada por el centro de despacho" },
          { id: `${id}-T3`, timestamp: at(dispatchSeconds), status: "asignada", actorId: operator.id, actorName: operator.name, note: `Unidad ${unit.callsign} asignada` },
          { id: `${id}-T4`, timestamp: at(dispatchSeconds + 20), status: "en_camino", actorId: unit.id, actorName: unit.callsign },
          { id: `${id}-T5`, timestamp: at(arriveSeconds), status: "en_sitio", actorId: unit.id, actorName: unit.callsign, note: "Unidad en el lugar" },
          { id: `${id}-T6`, timestamp: at(arriveSeconds + 60), status: "atendiendo", actorId: unit.id, actorName: unit.callsign },
          { id: `${id}-T7`, timestamp: at(closeSeconds - 120), status: "resuelta", actorId: unit.id, actorName: unit.callsign, note: "Situación controlada" },
          { id: `${id}-T8`, timestamp: at(closeSeconds), status: "cerrada", actorId: operator.id, actorName: operator.name, note: "Caso cerrado con novedad registrada" },
        );
      } else {
        timeline.push({ id: `${id}-T2`, timestamp: at(ackSeconds + 40), status: "cancelada", actorId: citizen.id, actorName: citizen.name, note: "Cancelada por el ciudadano" });
      }

      incidents.push({
        id,
        code: `NASS-${String(sequence).padStart(6, "0")}`,
        title: CATEGORY_TITLES[category] ?? "Reporte ciudadano",
        description: "Registro histórico consolidado por el centro de despacho.",
        category,
        status,
        priority,
        severity: PRIORITY_SEVERITY[priority],
        source: rand() < 0.55 ? "panico" : "reporte",
        zone,
        location: jitter(ZONE_COORDS[zone], 600),
        accuracy: 6 + Math.floor(rand() * 25),
        address: pick(STREETS),
        reportedAt: reportedAt.toISOString(),
        updatedAt: cancelled ? at(ackSeconds + 40) : at(closeSeconds),
        acknowledgedAt: cancelled ? undefined : at(ackSeconds),
        dispatchedAt: cancelled ? undefined : at(dispatchSeconds),
        arrivedAt: cancelled ? undefined : at(arriveSeconds),
        closedAt: cancelled ? at(ackSeconds + 40) : at(closeSeconds),
        reportedByUserId: citizen.id,
        reportedByName: citizen.name,
        reportedByPhone: citizen.phone,
        assignedUnitId: cancelled ? undefined : unit.id,
        operatorId: cancelled ? undefined : operator.id,
        timeline,
        locationTrail: [],
      });
    }
  }

  // --- Incidentes activos para que el mapa nunca esté vacío ----------------
  const activeBlueprint: Array<{ category: IncidentCategory; status: IncidentStatus; zone: QuibdoZone; minutesAgo: number }> = [
    { category: "emergencia_medica", status: "atendiendo", zone: "Centro", minutesAgo: 22 },
    { category: "robo", status: "en_camino", zone: "Cristo Rey", minutesAgo: 11 },
    { category: "accidente", status: "en_sitio", zone: "Kennedy", minutesAgo: 35 },
    { category: "riesgo_comunitario", status: "recibida", zone: "La Yesca", minutesAgo: 6 },
    { category: "persona_sospechosa", status: "nueva", zone: "San Vicente", minutesAgo: 2 },
  ];

  activeBlueprint.forEach((blueprint, index) => {
    sequence += 1;
    const id = `INC-${String(sequence).padStart(6, "0")}`;
    const reportedAt = new Date(now.getTime() - blueprint.minutesAgo * 60_000);
    const citizen = citizens[index % citizens.length];
    const operator = operators[index % operators.length];
    const priority = CATEGORY_PRIORITY[blueprint.category] ?? "media";
    const location = jitter(ZONE_COORDS[blueprint.zone], 400);

    const timeline: TimelineEvent[] = [
      { id: `${id}-T1`, timestamp: reportedAt.toISOString(), status: "nueva", actorId: citizen.id, actorName: citizen.name, note: "Alerta generada por el ciudadano" },
    ];

    let assignedUnit: Unit | undefined;
    if (blueprint.status !== "nueva") {
      timeline.push({ id: `${id}-T2`, timestamp: new Date(reportedAt.getTime() + 45_000).toISOString(), status: "recibida", actorId: operator.id, actorName: operator.name });
    }
    if (["asignada", "en_camino", "en_sitio", "atendiendo"].includes(blueprint.status)) {
      assignedUnit = units.find(
        (u) => u.availability === "disponible" &&
          (blueprint.category === "emergencia_medica" ? u.institution === "ambulancia" : u.institution === "policia"),
      ) ?? units[index];
      assignedUnit.availability = blueprint.status === "en_camino" ? "en_camino" : "en_sitio";
      assignedUnit.assignedIncidentId = id;
      assignedUnit.currentLocation = blueprint.status === "en_camino"
        ? jitter(location, 900)
        : jitter(location, 60);
      timeline.push({ id: `${id}-T3`, timestamp: new Date(reportedAt.getTime() + 120_000).toISOString(), status: "asignada", actorId: operator.id, actorName: operator.name, note: `Unidad ${assignedUnit.callsign} asignada` });
      if (blueprint.status !== "asignada") {
        timeline.push({ id: `${id}-T4`, timestamp: new Date(reportedAt.getTime() + 150_000).toISOString(), status: "en_camino", actorId: assignedUnit.id, actorName: assignedUnit.callsign });
      }
      if (blueprint.status === "en_sitio" || blueprint.status === "atendiendo") {
        timeline.push({ id: `${id}-T5`, timestamp: new Date(reportedAt.getTime() + 420_000).toISOString(), status: "en_sitio", actorId: assignedUnit.id, actorName: assignedUnit.callsign });
      }
      if (blueprint.status === "atendiendo") {
        timeline.push({ id: `${id}-T6`, timestamp: new Date(reportedAt.getTime() + 480_000).toISOString(), status: "atendiendo", actorId: assignedUnit.id, actorName: assignedUnit.callsign });
      }
    }

    incidents.push({
      id,
      code: `NASS-${String(sequence).padStart(6, "0")}`,
      title: CATEGORY_TITLES[blueprint.category] ?? "Reporte ciudadano",
      description: "Incidente activo en el territorio.",
      category: blueprint.category,
      status: blueprint.status,
      priority,
      severity: PRIORITY_SEVERITY[priority],
      source: "panico",
      zone: blueprint.zone,
      location,
      accuracy: 9,
      address: STREETS[index % STREETS.length],
      reportedAt: reportedAt.toISOString(),
      updatedAt: new Date(now.getTime() - 60_000).toISOString(),
      acknowledgedAt: blueprint.status === "nueva" ? undefined : new Date(reportedAt.getTime() + 45_000).toISOString(),
      dispatchedAt: assignedUnit ? new Date(reportedAt.getTime() + 120_000).toISOString() : undefined,
      arrivedAt: ["en_sitio", "atendiendo"].includes(blueprint.status) ? new Date(reportedAt.getTime() + 420_000).toISOString() : undefined,
      reportedByUserId: citizen.id,
      reportedByName: citizen.name,
      reportedByPhone: citizen.phone,
      assignedUnitId: assignedUnit?.id,
      operatorId: blueprint.status === "nueva" ? undefined : operator.id,
      timeline,
      locationTrail: [],
    });
  });

  incidents.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  return { users, credentials, units, incidents, sequence };
}
