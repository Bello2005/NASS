"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUsersStore } from "@/store/users.store";
import type { UserRole } from "@/types/user.types";
import type { QuibdoZone } from "@/types/incident.types";

export const userKeys = {
  all: ["users"] as const,
};

export function useUsers() {
  const users = useUsersStore((s) => s.users);
  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => Promise.resolve(users),
    staleTime: 30_000,
  });
}

export function useUserMutations() {
  const { createUser, updateUser, toggleUserStatus, deleteUser } = useUsersStore();
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: userKeys.all });

  return {
    createUser: (data: { name: string; email: string; role: UserRole; phone?: string; zone?: QuibdoZone }) => {
      createUser(data);
      invalidate();
    },
    updateUser: (id: string, patch: Parameters<typeof updateUser>[1]) => {
      updateUser(id, patch);
      invalidate();
    },
    toggleUserStatus: (id: string) => {
      toggleUserStatus(id);
      invalidate();
    },
    deleteUser: (id: string) => {
      deleteUser(id);
      invalidate();
    },
  };
}
