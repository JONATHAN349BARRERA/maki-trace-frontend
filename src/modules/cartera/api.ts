import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/shared/api/http';
import type { FacturaResumen } from './types';

export const carteraApi = {
  facturas: () => http.get<FacturaResumen[]>('/facturas'),
  generar: (periodo: string) => http.post<FacturaResumen[]>('/facturas/generar', { periodo }),
  registrarPago: (id: string, fechaPago?: string) => http.post<FacturaResumen>(`/facturas/${id}/pago`, { fechaPago }),
};

export const useFacturas = () => useQuery({ queryKey: ['facturas'], queryFn: carteraApi.facturas });

function useInvalidar() {
  const qc = useQueryClient();
  return () => {
    for (const key of ['facturas', 'informes', 'alertas']) qc.invalidateQueries({ queryKey: [key] });
  };
}
export const useGenerarFacturacion = () => useMutation({ mutationFn: carteraApi.generar, onSuccess: useInvalidar() });
export const useRegistrarPago = () =>
  useMutation({
    mutationFn: ({ id, fechaPago }: { id: string; fechaPago?: string }) => carteraApi.registrarPago(id, fechaPago),
    onSuccess: useInvalidar(),
  });
