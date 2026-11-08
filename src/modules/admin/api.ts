import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/shared/api/http';
import type { Usuario } from '@/modules/auth/types';

export type UsuarioInput = Omit<Usuario, 'id'> & { password?: string };

export const usuariosApi = {
  listar: () => http.get<Usuario[]>('/usuarios'),
  crear: (u: UsuarioInput) => http.post<Usuario>('/usuarios', u),
  actualizar: (id: string, u: Partial<UsuarioInput>) => http.put<Usuario>(`/usuarios/${id}`, u),
  restablecerDemo: () => http.post<{ ok: boolean }>('/admin/reset'),
};

export const useUsuarios = () => useQuery({ queryKey: ['usuarios'], queryFn: usuariosApi.listar });

export function useGuardarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: UsuarioInput }) =>
      id ? usuariosApi.actualizar(id, data) : usuariosApi.crear(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}
