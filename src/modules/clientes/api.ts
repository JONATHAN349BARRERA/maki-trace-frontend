import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/shared/api/http';
import type { Cliente, ClienteInput } from './types';

export const clientesApi = {
  listar: () => http.get<Cliente[]>('/clientes'),
  obtener: (id: string) => http.get<Cliente>(`/clientes/${id}`),
  crear: (c: ClienteInput) => http.post<Cliente>('/clientes', c),
  actualizar: (id: string, c: ClienteInput) => http.put<Cliente>(`/clientes/${id}`, c),
};

export const useClientes = (enabled = true) =>
  useQuery({ queryKey: ['clientes'], queryFn: clientesApi.listar, enabled });

export function useGuardarCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ClienteInput }) =>
      id ? clientesApi.actualizar(id, data) : clientesApi.crear(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}
