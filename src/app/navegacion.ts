import {
  Bell,
  ChartColumn,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  Printer,
  ScanLine,
  Send,
  Shield,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Rol } from '@/modules/auth/types';

export interface ItemMenu {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Rol[];
}

/** Menú con vistas diferenciadas por rol (propuesta §8.1, capa de presentación). */
export const MENU: ItemMenu[] = [
  { to: '/', label: 'Tablero', icon: LayoutDashboard, roles: ['gerente', 'gestor'] },
  { to: '/portal', label: 'Mi portal', icon: LayoutDashboard, roles: ['cliente'] },
  { to: '/tecnico', label: 'Mis casos', icon: Wrench, roles: ['tecnico'] },
  { to: '/escanear', label: 'Escanear QR', icon: ScanLine, roles: ['tecnico', 'gestor'] },
  { to: '/portal/solicitud', label: 'Nueva solicitud', icon: Send, roles: ['cliente'] },
  { to: '/casos', label: 'Casos', icon: ClipboardList, roles: ['gerente', 'gestor', 'cliente'] },
  { to: '/contratos', label: 'Contratos', icon: FileText, roles: ['gerente', 'gestor', 'cliente'] },
  { to: '/equipos', label: 'Equipos', icon: Printer, roles: ['gerente', 'gestor', 'cliente'] },
  {
    to: '/inventario',
    label: 'Repuestos y suministros',
    icon: Package,
    roles: ['gerente', 'gestor'],
  },
  { to: '/personal', label: 'Personal técnico', icon: Wrench, roles: ['gerente', 'gestor'] },
  { to: '/clientes', label: 'Clientes', icon: Users, roles: ['gerente', 'gestor'] },
  { to: '/cartera', label: 'Cartera', icon: Wallet, roles: ['gerente'] },
  { to: '/informes', label: 'Informes', icon: ChartColumn, roles: ['gerente', 'gestor'] },
  { to: '/alertas', label: 'Alertas', icon: Bell, roles: ['gerente', 'gestor'] },
  { to: '/admin/usuarios', label: 'Usuarios y roles', icon: Shield, roles: ['gerente'] },
];

export const menuPara = (rol: Rol) => MENU.filter((m) => m.roles.includes(rol));
