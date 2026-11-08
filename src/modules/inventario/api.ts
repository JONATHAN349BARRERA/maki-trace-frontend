import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, toQuery } from '@/shared/api/http';
import type { Item, ItemInput, Movimiento, MovimientoInput } from './types';

export const inventarioApi = {
  items: (modelo?: string) => http.get<Item[]>(`/items${toQuery({ modelo })}`),
  item: (id: string) => http.get<Item>(`/items/${id}`),
  crear: (i: ItemInput) => http.post<Item>('/items', i),
  actualizar: (id: string, i: ItemInput) => http.put<Item>(`/items/${id}`, i),
  movimientos: (itemId?: string) => http.get<Movimiento[]>(`/movimientos${toQuery({ itemId })}`),
  registrarMovimiento: (m: MovimientoInput) => http.post<Movimiento>('/movimientos', m),
};

export const useItems = (modelo?: string) =>
  useQuery({ queryKey: ['items', { modelo }], queryFn: () => inventarioApi.items(modelo) });
export const useItem = (id: string) =>
  useQuery({ queryKey: ['items', id], queryFn: () => inventarioApi.item(id) });
export const useMovimientos = (itemId?: string) =>
  useQuery({
    queryKey: ['movimientos', { itemId }],
    queryFn: () => inventarioApi.movimientos(itemId),
  });

function useInvalidarInventario() {
  const qc = useQueryClient();
  return () => {
    for (const key of ['items', 'movimientos', 'alertas', 'informes'])
      qc.invalidateQueries({ queryKey: [key] });
  };
}

export function useGuardarItem() {
  const onSuccess = useInvalidarInventario();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ItemInput }) =>
      id ? inventarioApi.actualizar(id, data) : inventarioApi.crear(data),
    onSuccess,
  });
}

export function useRegistrarMovimiento() {
  const onSuccess = useInvalidarInventario();
  return useMutation({ mutationFn: inventarioApi.registrarMovimiento, onSuccess });
}
