import type { User } from "@/types/user.types";

export const mockUsers: User[] = [
  // Admins
  { id: "USR-001", name: "Carlos Mosquera", email: "c.mosquera@nass.gov.co", role: "admin", status: "activo", phone: "+57 312 555 0101", createdAt: "2024-01-10T08:00:00Z", lastLoginAt: "2024-05-29T07:45:00Z", avatarInitials: "CM" },
  { id: "USR-002", name: "Ana Palacios",    email: "a.palacios@nass.gov.co", role: "admin", status: "activo", phone: "+57 310 555 0102", createdAt: "2024-01-12T08:00:00Z", lastLoginAt: "2024-05-29T08:00:00Z", avatarInitials: "AP" },
  { id: "USR-003", name: "Jorge Valencia",  email: "j.valencia@nass.gov.co", role: "admin", status: "activo", phone: "+57 315 555 0103", createdAt: "2024-02-01T08:00:00Z", lastLoginAt: "2024-05-28T17:30:00Z", avatarInitials: "JV" },
  { id: "USR-004", name: "Sandra Córdoba",  email: "s.cordoba@nass.gov.co",  role: "admin", status: "suspendido", phone: "+57 314 555 0104", createdAt: "2024-02-15T08:00:00Z", avatarInitials: "SC" },
  { id: "USR-005", name: "Ricardo Hurtado", email: "r.hurtado@nass.gov.co",  role: "admin", status: "activo", phone: "+57 300 555 0105", createdAt: "2024-03-01T08:00:00Z", lastLoginAt: "2024-05-29T06:00:00Z", avatarInitials: "RH" },

  // Líderes
  { id: "USR-006", name: "Juan Moreno",    email: "j.moreno@nass.gov.co",  role: "lider", status: "activo", phone: "+57 311 555 0201", zone: "Centro",     createdAt: "2024-01-20T08:00:00Z", lastLoginAt: "2024-05-29T14:00:00Z", avatarInitials: "JM" },
  { id: "USR-007", name: "Luis Rentería",  email: "l.renteria@nass.gov.co", role: "lider", status: "activo", phone: "+57 313 555 0202", zone: "Cristo Rey", createdAt: "2024-01-22T08:00:00Z", lastLoginAt: "2024-05-29T13:00:00Z", avatarInitials: "LR" },
  { id: "USR-008", name: "Pedro Copete",   email: "p.copete@nass.gov.co",   role: "lider", status: "activo", phone: "+57 316 555 0203", zone: "Kennedy",    createdAt: "2024-02-10T08:00:00Z", lastLoginAt: "2024-05-29T10:00:00Z", avatarInitials: "PC" },
  { id: "USR-009", name: "Gloria Asprilla",email: "g.asprilla@nass.gov.co", role: "lider", status: "suspendido",phone: "+57 317 555 0204", zone: "Huapango", createdAt: "2024-02-20T08:00:00Z", avatarInitials: "GA" },
  { id: "USR-010", name: "Edwin Mena",     email: "e.mena@nass.gov.co",     role: "lider", status: "activo", phone: "+57 318 555 0205", zone: "La Yesca",   createdAt: "2024-03-05T08:00:00Z", lastLoginAt: "2024-05-29T12:00:00Z", avatarInitials: "EM" },

  // Partners
  { id: "USR-011", name: "María Córdoba",   email: "m.cordoba@nass.gov.co",  role: "partner", status: "activo", phone: "+57 319 555 0301", zone: "Centro",     createdAt: "2024-02-01T08:00:00Z", lastLoginAt: "2024-05-29T15:00:00Z", avatarInitials: "MC" },
  { id: "USR-012", name: "Andrés Murillo",  email: "a.murillo@nass.gov.co",  role: "partner", status: "activo", phone: "+57 320 555 0302", zone: "San Vicente",createdAt: "2024-02-05T08:00:00Z", lastLoginAt: "2024-05-29T14:30:00Z", avatarInitials: "AM" },
  { id: "USR-013", name: "Claudia Granja",  email: "c.granja@nass.gov.co",   role: "partner", status: "activo", phone: "+57 321 555 0303", zone: "Chambacú",   createdAt: "2024-02-10T08:00:00Z", lastLoginAt: "2024-05-28T20:00:00Z", avatarInitials: "CG" },
  { id: "USR-014", name: "Felipe Usuaga",   email: "f.usuaga@nass.gov.co",   role: "partner", status: "suspendido",phone: "+57 322 555 0304", zone: "Kennedy", createdAt: "2024-03-01T08:00:00Z", avatarInitials: "FU" },
  { id: "USR-015", name: "Natalia Palomino",email: "n.palomino@nass.gov.co", role: "partner", status: "activo", phone: "+57 323 555 0305", zone: "Cristo Rey", createdAt: "2024-03-15T08:00:00Z", lastLoginAt: "2024-05-29T11:00:00Z", avatarInitials: "NP" },
];
