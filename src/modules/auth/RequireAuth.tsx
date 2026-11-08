import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Loading } from '@/shared/ui';
import { useAuth } from './AuthContext';
import type { Permiso } from './domain/permisos';

/** Protege rutas: exige sesión y, opcionalmente, un permiso del rol. */
export function RequireAuth({ permiso, children }: { permiso?: Permiso; children: ReactNode }) {
  const { usuario, cargando, puede } = useAuth();
  const location = useLocation();
  if (cargando) return <Loading label="Verificando sesión…" />;
  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (permiso && !puede(permiso)) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-lg font-semibold text-slate-800">Acceso restringido</h1>
        <p className="mt-1 text-sm text-slate-500">Su rol no tiene permiso para ver esta sección.</p>
      </div>
    );
  }
  return <>{children}</>;
}
