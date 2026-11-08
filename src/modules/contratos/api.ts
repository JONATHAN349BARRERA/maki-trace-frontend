import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/shared/api/http';
import type { ContratoInput, ContratoResumen } from './types';

export const contratosApi = {
  listar: () => http.get<ContratoResumen[]>('/contratos'),
  obtener: (id: string) => http.get<ContratoResumen>(`/contratos/${id}`),
  crear: (c: ContratoInput) => http.post<ContratoResumen>('/contratos', c),
  actualizar: (id: string, c: ContratoInput) => http.put<ContratoResumen>(`/contratos/${id}`, c),
};

export const useContratos = () => useQuery({ queryKey: ['contratos'], queryFn: contratosApi.listar });
export const useContrato = (id: string) =>
  useQuery({ queryKey: ['contratos', id], queryFn: () => contratosApi.obtener(id) });

export function useGuardarContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ContratoInput }) =>
      id ? contratosApi.actualizar(id, data) : contratosApi.crear(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contratos'] });
      qc.invalidateQueries({ queryKey: ['equipos'] });
    },
  });
}
