import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, toQuery } from '@/shared/api/http';
import type { EquipoInput, EquipoResumen } from './types';

export const equiposApi = {
  listar: (contratoId?: string) => http.get<EquipoResumen[]>(`/equipos${toQuery({ contratoId })}`),
  obtener: (id: string) => http.get<EquipoResumen>(`/equipos/${id}`),
  porSerial: (serial: string) => http.get<EquipoResumen>(`/equipos/serial/${encodeURIComponent(serial)}`),
  crear: (e: EquipoInput) => http.post<EquipoResumen>('/equipos', e),
  actualizar: (id: string, e: EquipoInput) => http.put<EquipoResumen>(`/equipos/${id}`, e),
  registrarLectura: (id: string, valor: number) => http.post<EquipoResumen>(`/equipos/${id}/lecturas`, { valor }),
  subirFoto: (id: string, foto: Blob) => {
    const form = new FormData();
    form.append('foto', foto, 'foto.jpg');
    return http.post<EquipoResumen>(`/equipos/${id}/fotos`, form);
  },
  eliminarFoto: (id: string, archivoId: string) =>
    http.delete<EquipoResumen>(`/equipos/${id}/fotos/${archivoId}`),
};

export const useEquipos = (contratoId?: string) =>
  useQuery({ queryKey: ['equipos', { contratoId }], queryFn: () => equiposApi.listar(contratoId) });
export const useEquipo = (id: string) =>
  useQuery({ queryKey: ['equipos', id], queryFn: () => equiposApi.obtener(id) });
export const useEquipoPorSerial = (serial: string) =>
  useQuery({ queryKey: ['equipos', 'serial', serial], queryFn: () => equiposApi.porSerial(serial), retry: false });

function useInvalidarEquipos() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['equipos'] });
}

export function useGuardarEquipo() {
  const invalidar = useInvalidarEquipos();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: EquipoInput }) =>
      id ? equiposApi.actualizar(id, data) : equiposApi.crear(data),
    onSuccess: invalidar,
  });
}

export function useRegistrarLectura(id: string) {
  const invalidar = useInvalidarEquipos();
  return useMutation({ mutationFn: (valor: number) => equiposApi.registrarLectura(id, valor), onSuccess: invalidar });
}

export function useFotosEquipo(id: string) {
  const invalidar = useInvalidarEquipos();
  const subir = useMutation({ mutationFn: (foto: Blob) => equiposApi.subirFoto(id, foto), onSuccess: invalidar });
  const eliminar = useMutation({
    mutationFn: (archivoId: string) => equiposApi.eliminarFoto(id, archivoId),
    onSuccess: invalidar,
  });
  return { subir, eliminar };
}
