import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, toQuery } from '@/shared/api/http';
import type {
  Advertencia,
  CasoDetalle,
  EstadoCaso,
  NuevaSolicitud,
  TrabajoRealizado,
} from './types';

export interface FiltroCasos {
  estado?: EstadoCaso;
  equipoId?: string;
  contratoId?: string;
}

export const casosApi = {
  listar: (f: FiltroCasos = {}) => http.get<CasoDetalle[]>(`/casos${toQuery({ ...f })}`),
  obtener: (id: string) => http.get<CasoDetalle>(`/casos/${id}`),
  crear: (s: NuevaSolicitud) => http.post<CasoDetalle>('/casos', s),
  prevalidar: (s: NuevaSolicitud) => http.post<Advertencia[]>('/casos/validar', s),
  validacion: (id: string) => http.get<Advertencia[]>(`/casos/${id}/validacion`),
  aprobar: (id: string, body: { confirmarAdvertencias?: boolean; nota?: string }) =>
    http.post<CasoDetalle>(`/casos/${id}/aprobar`, body),
  rechazar: (id: string, nota: string) => http.post<CasoDetalle>(`/casos/${id}/rechazar`, { nota }),
  asignar: (id: string, body: { tecnicoId: string; fechaProgramada?: string; nota?: string }) =>
    http.post<CasoDetalle>(`/casos/${id}/asignar`, body),
  iniciar: (id: string) => http.post<CasoDetalle>(`/casos/${id}/iniciar`),
  cerrar: (id: string, trabajo: TrabajoRealizado) =>
    http.post<CasoDetalle>(`/casos/${id}/cerrar`, trabajo),
};

export const useCasos = (f: FiltroCasos = {}) =>
  useQuery({ queryKey: ['casos', f], queryFn: () => casosApi.listar(f) });
export const useCaso = (id: string) =>
  useQuery({ queryKey: ['casos', id], queryFn: () => casosApi.obtener(id) });
export const useValidacionCaso = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: ['casos', id, 'validacion'],
    queryFn: () => casosApi.validacion(id),
    enabled,
  });

/** Cualquier cambio de un caso afecta hoja de vida, inventario, alertas e informes. */
export function useAccionCaso<T>(fn: (vars: T) => Promise<CasoDetalle>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of [
        'casos',
        'equipos',
        'items',
        'movimientos',
        'alertas',
        'informes',
        'tecnicos',
      ]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
