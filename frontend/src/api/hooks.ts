import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Career, Subject } from './types';

export function useCareers() {
  return useQuery({
    queryKey: ['careers'],
    queryFn: () => api<Career[]>('/catalog/careers'),
    staleTime: Infinity,
  });
}

export function useSubjects(careerId?: number, planId?: number) {
  const params = new URLSearchParams();
  if (careerId) params.set('careerId', String(careerId));
  if (planId) params.set('planId', String(planId));
  return useQuery({
    queryKey: ['subjects', careerId ?? 'all', planId ?? 'all'],
    queryFn: () => api<Subject[]>(`/catalog/subjects?${params}`),
    staleTime: Infinity,
  });
}

/** Planes de la carrera elegida (o de todas), con el vigente primero. */
export function usePlans(careerId?: number) {
  const careers = useCareers();
  const plans = (careers.data ?? [])
    .filter((c) => !careerId || c.id === careerId)
    .flatMap((c) => c.plans.map((p) => ({ ...p, careerName: c.name })));
  return plans.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || b.year - a.year);
}
