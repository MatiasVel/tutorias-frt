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

export function useSubjects(careerId?: number) {
  return useQuery({
    queryKey: ['subjects', careerId ?? 'all'],
    queryFn: () => api<Subject[]>(`/catalog/subjects${careerId ? `?careerId=${careerId}` : ''}`),
    staleTime: Infinity,
  });
}
