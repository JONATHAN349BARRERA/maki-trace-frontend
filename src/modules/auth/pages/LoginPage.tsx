import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Alert, Button, Input } from '@/shared/ui';
import { useAuth } from '../AuthContext';
import { rutaInicial } from '../domain/permisos';

const schema = z.object({
  usuario: z.string().trim().min(1, 'Ingrese su usuario'),
  password: z.string().min(1, 'Ingrese su contraseña'),
});
type Form = z.infer<typeof schema>;

const DEMO = [
  { usuario: 'gerente', rol: 'Gerente' },
  { usuario: 'gestor', rol: 'Gestor de servicios' },
  { usuario: 'tecnico', rol: 'Técnico' },
  { usuario: 'cliente', rol: 'Cliente (Colegio San Ángel)' },
  { usuario: 'cliente2', rol: 'Cliente (Papelería)' },
];

export function LoginPage() {
  const { login, usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { usuario: '', password: '' } });

  if (usuario) return <Navigate to={rutaInicial(usuario.rol)} replace />;

  const onSubmit = handleSubmit(async ({ usuario: u, password }) => {
    setError(null);
    try {
      const user = await login(u, password);
      const destino = (location.state as { from?: string } | null)?.from;
      navigate(destino ?? rutaInicial(user.rol), { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible iniciar sesión.');
    }
  });

  const mostrarDemo = import.meta.env.VITE_USE_MOCKS !== 'false';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 to-brand-600 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <p className="text-3xl font-bold tracking-tight">MAKI-TRACE</p>
          <p className="mt-1 text-sm text-brand-100">
            Gestión de contratos de arriendo y posventa · Maki Import Group S.A.S.
          </p>
        </div>
        <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-slate-800">Iniciar sesión</h1>
          {error && <Alert tone="danger">{error}</Alert>}
          <Input label="Usuario" autoComplete="username" error={errors.usuario?.message} {...register('usuario')} />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
        {mostrarDemo && (
          <div className="mt-4 rounded-xl bg-white/10 p-4 text-sm text-white">
            <p className="font-medium">Usuarios de demostración (contraseña: maki2026)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.usuario}
                  type="button"
                  onClick={() => {
                    setValue('usuario', d.usuario);
                    setValue('password', 'maki2026');
                  }}
                  className="rounded-full bg-white/20 px-3 py-1 text-xs hover:bg-white/30"
                >
                  {d.rol}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
