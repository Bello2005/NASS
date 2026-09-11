"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const sessionKey = ["session"] as const;

export function useSession() {
  const query = useQuery({
    queryKey: sessionKey,
    queryFn: () => api.me(),
    staleTime: 30_000,
    retry: false,
  });

  return {
    user: query.data?.user ?? null,
    unit: query.data?.unit ?? null,
    isLoading: query.isLoading,
  };
}

export function useInvalidateSession() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: sessionKey });
}
