"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAnalytics(days: number) {
  return useQuery({
    queryKey: ["analytics", "summary", days],
    queryFn: () => api.summary(days),
    staleTime: 20_000,
  });
}

export function useHeatmap(days: number) {
  return useQuery({
    queryKey: ["analytics", "heatmap", days],
    queryFn: () => api.heatmap(days),
    staleTime: 60_000,
  });
}
