"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const unitKeys = { all: ["units"] as const };

export function useUnits() {
  return useQuery({
    queryKey: unitKeys.all,
    queryFn: async () => (await api.listUnits()).units,
    staleTime: 5_000,
  });
}
