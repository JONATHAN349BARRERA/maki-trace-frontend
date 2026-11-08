import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { permisosDe } from '@/modules/auth/domain/permisos';
import { ROL_LABEL, type Rol, type Usuario } from '@/modules/auth/types';
import { useClientes } from '@/modules/clientes/api';
import { useTecnicos } from '@/modules/personal/api';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  ErrorState,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  Table,
} from '@/shared/ui';
import { useGuardarUsuario, usuariosApi, useUsuarios } from '../api';

const schema = z
  .object({
    nombre: z.string().trim().min(3, 'Nombre requerido'),
    usuario: z
      .string()
      .trim()
      .regex(/^[a-z0-9._-]{3,}$/i, 'Mínimo 3 caracteres, sin espacios'),
    email: z.email('Correo inválido'),
    rol: z.enum(['gerente', 'gestor', 'tecnico', 'cliente']),
    clienteId: z.string().optional(),
    tecnicoId: z.string().optional(),
    activo: z.boolean(),
    password: z.string().optional(),
  })
  .refine((d) => d.rol !== 'cliente' || !!d.clienteId, {
    path: ['clienteId'],
    message: 'Seleccione la organización',
  })
  .refine((d) => d.rol !== 'tecnico' || !!d.tecnicoId, {
    path: ['tecnicoId'],
    message: 'Seleccione la ficha del técnico',
  });
type Form = z.infer<typeof schema>;

function UsuarioForm({ usuario, onDone }: { usuario?: Usuario; onDone: () => void }) {
  const guardar = useGuardarUsuario();
  const clientes = useClientes();
  const tecnicos = useTecnicos();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: usuario ?? { rol: 'gestor', activo: true },
  });
  const rol = useWatch({ control, name: 'rol' });
  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={handleSubmit(async (d) => {
        if (!usuario && (!d.password || d.password.length < 8)) {
          setError('password', { message: 'Mínimo 8 caracteres' });
          return;
        }
        await guardar.mutateAsync({
          id: usuario?.id,
          data: {
            ...d,
            clienteId: d.rol === 'cliente' ? d.clienteId : undefined,
            tecnicoId: d.rol === 'tecnico' ? d.tecnicoId : undefined,
            password: d.password || undefined,
          },
        });
        onDone();
      })}
    >
      {guardar.error && <Alert tone="danger">{guardar.error.message}</Alert>}
      <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Usuario"
          error={errors.usuario?.message}
          disabled={!!usuario}
          {...register('usuario')}
        />
        <Input label="Correo" type="email" error={errors.email?.message} {...register('email')} />
      </div>
      <Select
        label="Rol"
        options={Object.entries(ROL_LABEL).map(([value, label]) => ({ value, label }))}
        {...register('rol')}
      />
      {rol === 'cliente' && (
        <Select
          label="Organización"
          placeholder="Seleccione…"
          error={errors.clienteId?.message}
          options={(clientes.data ?? []).map((c) => ({ value: c.id, label: c.razonSocial }))}
          {...register('clienteId')}
        />
      )}
      {rol === 'tecnico' && (
        <Select
          label="Ficha de técnico"
          placeholder="Seleccione…"
          error={errors.tecnicoId?.message}
          options={(tecnicos.data ?? []).map((t) => ({ value: t.id, label: t.nombre }))}
          {...register('tecnicoId')}
        />
      )}
      <Input
        label={usuario ? 'Nueva contraseña (opcional)' : 'Contraseña'}
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Checkbox label="Activo" {...register('activo')} />
      <div className="flex justify-end">
        <Button type="submit" disabled={guardar.isPending}>
          Guardar
        </Button>
      </div>
    </form>
  );
}

export function UsuariosPage() {
  const { data, isLoading, error } = useUsuarios();
  const qc = useQueryClient();
  const [editando, setEditando] = useState<Usuario | 'nuevo' | null>(null);
  const [confirmarReset, setConfirmarReset] = useState(false);
  return (
    <>
      <PageHeader
        title="Usuarios y roles"
        subtitle="Cada actor solo ve y modifica la información que le corresponde"
        actions={
          <>
            {import.meta.env.VITE_USE_MOCKS !== 'false' && (
              <Button variant="secondary" onClick={() => setConfirmarReset(true)}>
                <RotateCcw size={16} /> Restablecer datos demo
              </Button>
            )}
            <Button onClick={() => setEditando('nuevo')}>
              <Plus size={16} /> Nuevo usuario
            </Button>
          </>
        }
      />
      <Card className="mb-4">
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <Table<Usuario>
            rows={data ?? []}
            rowKey={(u) => u.id}
            columns={[
              { header: 'Nombre', cell: (u) => <span className="font-medium">{u.nombre}</span> },
              { header: 'Usuario', cell: (u) => u.usuario },
              { header: 'Correo', cell: (u) => u.email },
              { header: 'Rol', cell: (u) => <Badge tone="blue">{ROL_LABEL[u.rol]}</Badge> },
              {
                header: 'Estado',
                cell: (u) => (
                  <Badge tone={u.activo ? 'green' : 'gray'}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                ),
              },
              {
                header: '',
                cell: (u) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Editar ${u.nombre}`}
                    onClick={() => setEditando(u)}
                  >
                    <Pencil size={14} />
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
      <Card title="Permisos por rol">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(ROL_LABEL) as Rol[]).map((r) => (
            <div key={r}>
              <p className="mb-1 text-sm font-semibold text-slate-800">{ROL_LABEL[r]}</p>
              <ul className="space-y-0.5 text-xs text-slate-600">
                {permisosDe(r).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
      <Modal
        open={editando !== null}
        title={editando === 'nuevo' ? 'Nuevo usuario' : 'Editar usuario'}
        onClose={() => setEditando(null)}
      >
        {editando !== null && (
          <UsuarioForm
            usuario={editando === 'nuevo' ? undefined : editando}
            onDone={() => setEditando(null)}
          />
        )}
      </Modal>
      <Modal
        open={confirmarReset}
        title="Restablecer datos de demostración"
        onClose={() => setConfirmarReset(false)}
        footer={
          <Button
            variant="danger"
            onClick={async () => {
              await usuariosApi.restablecerDemo();
              setConfirmarReset(false);
              qc.invalidateQueries();
            }}
          >
            Restablecer
          </Button>
        }
      >
        <p className="text-sm text-slate-600">
          Se borrarán los cambios hechos en la demo y se cargarán de nuevo los datos iniciales. Su
          sesión se mantiene.
        </p>
      </Modal>
    </>
  );
}
