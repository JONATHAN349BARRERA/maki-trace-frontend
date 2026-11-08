import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@/shared/api/http';
import { authApi } from './api';
import { puede, type Permiso } from './domain/permisos';
import type { Usuario } from './types';

interface AuthState {
  usuario: Usuario | null;
  cargando: boolean;
  login: (usuario: string, password: string) => Promise<Usuario>;
  logout: () => void;
  puede: (permiso: Permiso) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(() => !!tokenStorage.get());

  useEffect(() => {
    if (!tokenStorage.get()) return;
    authApi
      .me()
      .then(setUsuario)
      .catch(() => tokenStorage.clear())
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    const sesion = await authApi.login(u, p);
    tokenStorage.set(sesion.token);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUsuario(null);
    qc.clear();
  }, [qc]);

  const value = useMemo<AuthState>(
    () => ({ usuario, cargando, login, logout, puede: (p) => puede(usuario?.rol, p) }),
    [usuario, cargando, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

/** Usuario autenticado (solo en rutas protegidas). */
export function useUsuario(): Usuario {
  const { usuario } = useAuth();
  if (!usuario) throw new Error('No hay sesión activa');
  return usuario;
}
