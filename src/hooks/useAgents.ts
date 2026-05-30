"use client";

import { useQuery } from "@tanstack/react-query";
import { mockAgents } from "@/mocks/agents.mock";

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: () => Promise.resolve(mockAgents),
    staleTime: 30_000,
  });
}
