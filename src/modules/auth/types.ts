export type Rol = 'gerente' | 'gestor' | 'tecnico' | 'cliente';

export const ROL_LABEL: Record<Rol, string> = {
  gerente: 'Gerente',
  gestor: 'Gestor de servicios',
  tecnico: 'Personal técnico',
  cliente: 'Cliente',
};

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  email: string;
  rol: Rol;
  activo: boolean;
  /** Solo para rol cliente: organización a la que pertenece. */
  clienteId?: string;
  /** Solo para rol técnico: ficha de personal técnico asociada. */
  tecnicoId?: string;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}
