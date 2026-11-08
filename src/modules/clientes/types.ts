export type TipoCliente = 'papeleria' | 'educativa' | 'empresa';

export const TIPO_CLIENTE_LABEL: Record<TipoCliente, string> = {
  papeleria: 'Papelería',
  educativa: 'Institución educativa',
  empresa: 'Empresa',
};

export interface Cliente {
  id: string;
  nit: string;
  razonSocial: string;
  tipo: TipoCliente;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
}

export type ClienteInput = Omit<Cliente, 'id'>;
