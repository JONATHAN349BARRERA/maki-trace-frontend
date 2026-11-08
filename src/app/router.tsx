import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { useAuth } from '@/modules/auth/AuthContext';
import { rutaInicial, type Permiso } from '@/modules/auth/domain/permisos';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { RequireAuth } from '@/modules/auth/RequireAuth';
import { Loading } from '@/shared/ui';
import { AppLayout } from './AppLayout';

/** Carga diferida por página: cada módulo se descarga solo cuando se usa. */
function page(loader: () => Promise<Record<string, unknown>>, name: string) {
  const C = lazy(async () => ({ default: (await loader())[name] as ComponentType }));
  return <C />;
}

const dashboard = page(() => import('@/modules/informes/pages/DashboardPage'), 'DashboardPage');

const guard = (permiso: Permiso | undefined, el: ReactNode) => (
  <RequireAuth permiso={permiso}>
    <Suspense fallback={<Loading />}>{el}</Suspense>
  </RequireAuth>
);

function Inicio() {
  const { usuario, puede } = useAuth();
  if (usuario && !puede('dashboard')) return <Navigate to={rutaInicial(usuario.rol)} replace />;
  return dashboard;
}

function NoEncontrado() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold text-slate-800">Página no encontrada</h1>
    </div>
  );
}

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: guard(undefined, <Inicio />) },
      // Cliente
      {
        path: 'portal',
        element: guard(
          'casos:crear',
          page(() => import('@/modules/casos/pages/PortalClientePage'), 'PortalClientePage'),
        ),
      },
      {
        path: 'portal/solicitud',
        element: guard(
          'casos:crear',
          page(() => import('@/modules/casos/pages/NuevaSolicitudPage'), 'NuevaSolicitudPage'),
        ),
      },
      // Técnico
      {
        path: 'tecnico',
        element: guard(
          'casos:atender',
          page(() => import('@/modules/casos/pages/TecnicoPage'), 'TecnicoPage'),
        ),
      },
      {
        path: 'escanear',
        element: guard(
          'qr:escanear',
          page(() => import('@/modules/equipos/pages/EscanearQRPage'), 'EscanearQRPage'),
        ),
      },
      // Casos
      {
        path: 'casos',
        element: guard(
          'casos:ver',
          page(() => import('@/modules/casos/pages/CasosPage'), 'CasosPage'),
        ),
      },
      {
        path: 'casos/nuevo',
        element: guard(
          'casos:crear',
          page(() => import('@/modules/casos/pages/NuevaSolicitudPage'), 'NuevaSolicitudPage'),
        ),
      },
      {
        path: 'casos/:id',
        element: guard(
          'casos:ver',
          page(() => import('@/modules/casos/pages/CasoDetallePage'), 'CasoDetallePage'),
        ),
      },
      // Contratos
      {
        path: 'contratos',
        element: guard(
          'contratos:ver',
          page(() => import('@/modules/contratos/pages/ContratosPage'), 'ContratosPage'),
        ),
      },
      {
        path: 'contratos/nuevo',
        element: guard(
          'contratos:editar',
          page(() => import('@/modules/contratos/pages/ContratoFormPage'), 'ContratoFormPage'),
        ),
      },
      {
        path: 'contratos/:id',
        element: guard(
          'contratos:ver',
          page(
            () => import('@/modules/contratos/pages/ContratoDetallePage'),
            'ContratoDetallePage',
          ),
        ),
      },
      {
        path: 'contratos/:id/editar',
        element: guard(
          'contratos:editar',
          page(() => import('@/modules/contratos/pages/ContratoFormPage'), 'ContratoFormPage'),
        ),
      },
      // Equipos
      {
        path: 'equipos',
        element: guard(
          'equipos:ver',
          page(() => import('@/modules/equipos/pages/EquiposPage'), 'EquiposPage'),
        ),
      },
      {
        path: 'equipos/nuevo',
        element: guard(
          'equipos:editar',
          page(() => import('@/modules/equipos/pages/EquipoFormPage'), 'EquipoFormPage'),
        ),
      },
      {
        path: 'equipos/serial/:serial',
        element: guard(
          'equipos:ver',
          page(() => import('@/modules/equipos/pages/EquipoPorSerialPage'), 'EquipoPorSerialPage'),
        ),
      },
      {
        path: 'equipos/:id',
        element: guard(
          'equipos:ver',
          page(() => import('@/modules/equipos/pages/HojaDeVidaPage'), 'HojaDeVidaPage'),
        ),
      },
      {
        path: 'equipos/:id/editar',
        element: guard(
          'equipos:editar',
          page(() => import('@/modules/equipos/pages/EquipoFormPage'), 'EquipoFormPage'),
        ),
      },
      // Inventario
      {
        path: 'inventario',
        element: guard(
          'inventario:ver',
          page(() => import('@/modules/inventario/pages/InventarioPage'), 'InventarioPage'),
        ),
      },
      {
        path: 'inventario/:id',
        element: guard(
          'inventario:ver',
          page(() => import('@/modules/inventario/pages/ItemDetallePage'), 'ItemDetallePage'),
        ),
      },
      // Personal
      {
        path: 'personal',
        element: guard(
          'personal:ver',
          page(() => import('@/modules/personal/pages/PersonalPage'), 'PersonalPage'),
        ),
      },
      {
        path: 'personal/:id',
        element: guard(
          'personal:ver',
          page(() => import('@/modules/personal/pages/TecnicoDetallePage'), 'TecnicoDetallePage'),
        ),
      },
      // Administración e informes
      {
        path: 'clientes',
        element: guard(
          'clientes:ver',
          page(() => import('@/modules/clientes/pages/ClientesPage'), 'ClientesPage'),
        ),
      },
      {
        path: 'cartera',
        element: guard(
          'cartera:ver',
          page(() => import('@/modules/cartera/pages/CarteraPage'), 'CarteraPage'),
        ),
      },
      {
        path: 'informes',
        element: guard(
          'informes:ver',
          page(() => import('@/modules/informes/pages/InformesPage'), 'InformesPage'),
        ),
      },
      {
        path: 'alertas',
        element: guard(
          'dashboard',
          page(() => import('@/modules/alertas/pages/AlertasPage'), 'AlertasPage'),
        ),
      },
      {
        path: 'admin/usuarios',
        element: guard(
          'usuarios:administrar',
          page(() => import('@/modules/admin/pages/UsuariosPage'), 'UsuariosPage'),
        ),
      },
      { path: '*', element: <NoEncontrado /> },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
