"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.users()).users,
    staleTime: 30_000,
  });
}
