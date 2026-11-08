import { useQuery } from '@tanstack/react-query';
import { http } from '@/shared/api/http';
import type { Alerta } from './types';

export const alertasApi = { listar: () => http.get<Alerta[]>('/alertas') };

export const useAlertas = (enabled = true) =>
  useQuery({ queryKey: ['alertas'], queryFn: alertasApi.listar, enabled, refetchInterval: 60_000 });
