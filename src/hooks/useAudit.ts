"use client";

import { useQuery } from "@tanstack/react-query";
import { mockAuditLog } from "@/mocks/audit.mock";

export function useAuditLog() {
  return useQuery({
    queryKey: ["audit"],
    queryFn: () => Promise.resolve(mockAuditLog),
    staleTime: 60_000,
  });
}
