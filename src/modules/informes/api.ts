import { useQuery } from '@tanstack/react-query';
import { http } from '@/shared/api/http';
import type { Dashboard, FilaContrato, FilaPersonal, InformeCartera, InformeCasos, InformeInventario } from './types';

export const informesApi = {
  dashboard: () => http.get<Dashboard>('/informes/dashboard'),
  casos: () => http.get<InformeCasos>('/informes/casos'),
  personal: () => http.get<FilaPersonal[]>('/informes/personal'),
  inventario: () => http.get<InformeInventario>('/informes/inventario'),
  contratos: () => http.get<FilaContrato[]>('/informes/contratos'),
  cartera: () => http.get<InformeCartera>('/informes/cartera'),
};

export const useDashboard = () => useQuery({ queryKey: ['informes', 'dashboard'], queryFn: informesApi.dashboard });
export const useInformeCasos = () => useQuery({ queryKey: ['informes', 'casos'], queryFn: informesApi.casos });
export const useInformePersonal = () => useQuery({ queryKey: ['informes', 'personal'], queryFn: informesApi.personal });
export const useInformeInventario = () =>
  useQuery({ queryKey: ['informes', 'inventario'], queryFn: informesApi.inventario });
export const useInformeContratos = () =>
  useQuery({ queryKey: ['informes', 'contratos'], queryFn: informesApi.contratos });
export const useInformeCartera = () => useQuery({ queryKey: ['informes', 'cartera'], queryFn: informesApi.cartera });
