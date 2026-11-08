import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth, useUsuario } from '@/modules/auth/AuthContext';
import { ROL_LABEL } from '@/modules/auth/types';
import { AlertasBell } from '@/modules/alertas/components/AlertasBell';
import { cn } from '@/shared/lib/cn';
import { menuPara } from './navegacion';

export function AppLayout() {
  const usuario = useUsuario();
  const { logout, puede } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const menu = menuPara(usuario.rol);

  const nav = (
    <nav aria-label="Principal" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {menu.map((m) => (
        <NavLink
          key={m.to}
          to={m.to}
          end={m.to === '/' || m.to === '/portal'}
          onClick={() => setAbierto(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
              isActive ? 'bg-white/15 text-white' : 'text-brand-100 hover:bg-white/10 hover:text-white',
            )
          }
        >
          <m.icon size={18} aria-hidden />
          {m.label}
        </NavLink>
      ))}
    </nav>
  );

  const marca = (
    <div className="px-6 py-5">
      <p className="text-lg font-bold tracking-tight text-white">MAKI-TRACE</p>
      <p className="text-xs text-brand-100">Maki Import Group S.A.S.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Barra lateral en escritorio */}
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 flex-col bg-brand-900 lg:flex">
        {marca}
        {nav}
      </aside>

      {/* Menú deslizable en celular */}
      {abierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setAbierto(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-brand-900">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-4 rounded p-1 text-white hover:bg-white/10"
            >
              <X size={20} />
            </button>
            {marca}
            {nav}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setAbierto(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          {puede('dashboard') && <AlertasBell />}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-800">{usuario.nombre}</p>
            <p className="text-xs text-slate-500">{ROL_LABEL[usuario.rol]}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <LogOut size={20} />
          </button>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
