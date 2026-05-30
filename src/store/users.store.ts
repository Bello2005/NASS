import { create } from "zustand";
import { mockUsers } from "@/mocks/users.mock";
import type { User, UserRole, UserStatus } from "@/types/user.types";
import type { QuibdoZone } from "@/types/incident.types";

interface UsersState {
  users: User[];
  createUser: (data: { name: string; email: string; role: UserRole; phone?: string; zone?: QuibdoZone }) => void;
  updateUser: (id: string, patch: Partial<Pick<User, "name" | "email" | "role" | "phone" | "zone">>) => void;
  toggleUserStatus: (id: string) => void;
  deleteUser: (id: string) => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: mockUsers,

  createUser: (data) =>
    set((state) => ({
      users: [
        ...state.users,
        {
          id: `USR-${String(state.users.length + 1).padStart(3, "0")}`,
          ...data,
          status: "activo" as UserStatus,
          createdAt: new Date().toISOString(),
          avatarInitials: data.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
        },
      ],
    })),

  updateUser: (id, patch) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),

  toggleUserStatus: (id) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id ? { ...u, status: u.status === "activo" ? "suspendido" : "activo" } : u
      ),
    })),

  deleteUser: (id) =>
    set((state) => ({ users: state.users.filter((u) => u.id !== id) })),
}));
