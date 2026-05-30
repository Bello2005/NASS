import type { Agent } from "@/types/agent.types";

export const mockAgents: Agent[] = [
  { id: "AGT-001", name: "Luis Rentería",   badge: "NASS-0041", role: "lider",   availability: "en_servicio",    currentLocation: { lat: 5.6940, lng: -76.6598 }, assignedIncidentId: "INC-2024-001", lastUpdated: "2024-05-29T14:50:00Z" },
  { id: "AGT-002", name: "Pedro Copete",    badge: "NASS-0042", role: "lider",   availability: "disponible",     currentLocation: { lat: 5.6875, lng: -76.6525 }, lastUpdated: "2024-05-29T14:45:00Z" },
  { id: "AGT-003", name: "Juan Moreno",     badge: "NASS-0043", role: "lider",   availability: "en_servicio",    currentLocation: { lat: 5.7008, lng: -76.6483 }, assignedIncidentId: "INC-2024-003", lastUpdated: "2024-05-29T15:20:00Z" },
  { id: "AGT-004", name: "Edwin Mena",      badge: "NASS-0044", role: "lider",   availability: "disponible",     currentLocation: { lat: 5.6828, lng: -76.6558 }, lastUpdated: "2024-05-29T14:00:00Z" },
  { id: "AGT-005", name: "María Córdoba",   badge: "NASS-0051", role: "partner", availability: "en_servicio",    currentLocation: { lat: 5.7048, lng: -76.6553 }, assignedIncidentId: "INC-2024-008", lastUpdated: "2024-05-29T13:35:00Z" },
  { id: "AGT-006", name: "Andrés Murillo",  badge: "NASS-0052", role: "partner", availability: "disponible",     currentLocation: { lat: 5.6882, lng: -76.6695 }, lastUpdated: "2024-05-29T14:00:00Z" },
  { id: "AGT-007", name: "Claudia Granja",  badge: "NASS-0053", role: "partner", availability: "disponible",     currentLocation: { lat: 5.6958, lng: -76.6643 }, lastUpdated: "2024-05-29T13:45:00Z" },
  { id: "AGT-008", name: "Natalia Palomino",badge: "NASS-0054", role: "partner", availability: "fuera_servicio", currentLocation: { lat: 5.6867, lng: -76.6517 }, lastUpdated: "2024-05-29T07:00:00Z" },
  { id: "AGT-009", name: "Felipe Usuaga",   badge: "NASS-0055", role: "partner", availability: "disponible",     currentLocation: { lat: 5.6963, lng: -76.6650 }, lastUpdated: "2024-05-29T14:30:00Z" },
  { id: "AGT-010", name: "Carlos Pino",     badge: "NASS-0056", role: "partner", availability: "fuera_servicio", currentLocation: { lat: 5.7052, lng: -76.6548 }, lastUpdated: "2024-05-29T06:30:00Z" },
];
