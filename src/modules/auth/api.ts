import { http } from '@/shared/api/http';
import type { Sesion, Usuario } from './types';

export const authApi = {
  login: (usuario: string, password: string) => http.post<Sesion>('/auth/login', { usuario, password }),
  me: () => http.get<Usuario>('/auth/me'),
};
