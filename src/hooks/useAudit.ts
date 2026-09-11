"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAudit(query?: string) {
  return useQuery({
    queryKey: ["audit", query ?? ""],
    queryFn: async () => (await api.audit(query)).entries,
    staleTime: 15_000,
  });
}
