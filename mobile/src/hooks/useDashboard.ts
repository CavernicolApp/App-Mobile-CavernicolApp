// src/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '@/api/dashboard';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardSummary,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
