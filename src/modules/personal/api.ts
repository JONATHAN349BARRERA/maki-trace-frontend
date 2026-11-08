import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/shared/api/http';
import type { Tecnico, TecnicoDetalle, TecnicoInput } from './types';

export const personalApi = {
  listar: () => http.get<Tecnico[]>('/tecnicos'),
  obtener: (id: string) => http.get<TecnicoDetalle>(`/tecnicos/${id}`),
  crear: (t: TecnicoInput) => http.post<Tecnico>('/tecnicos', t),
  actualizar: (id: string, t: TecnicoInput) => http.put<Tecnico>(`/tecnicos/${id}`, t),
};

export const useTecnicos = (enabled = true) =>
  useQuery({ queryKey: ['tecnicos'], queryFn: personalApi.listar, enabled });
export const useTecnico = (id: string) =>
  useQuery({ queryKey: ['tecnicos', id], queryFn: () => personalApi.obtener(id) });

export function useGuardarTecnico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: TecnicoInput }) =>
      id ? personalApi.actualizar(id, data) : personalApi.crear(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tecnicos'] }),
  });
}
