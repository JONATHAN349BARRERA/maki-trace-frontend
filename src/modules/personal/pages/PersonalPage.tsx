import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
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
  Table,
} from '@/shared/ui';
import { useGuardarTecnico, useTecnicos } from '../api';
import type { Tecnico } from '../types';

const schema = z.object({
  nombre: z.string().trim().min(3, 'Nombre requerido'),
  documento: z.string().trim().min(5, 'Documento requerido'),
  telefono: z.string().trim().min(7, 'Teléfono inválido'),
  email: z.email('Correo inválido'),
  zona: z.string().trim().min(2, 'Zona requerida'),
  especialidad: z.string().trim().min(2, 'Especialidad requerida'),
  activo: z.boolean(),
});
type Form = z.infer<typeof schema>;

export function TecnicoForm({ tecnico, onDone }: { tecnico?: Tecnico; onDone: () => void }) {
  const guardar = useGuardarTecnico();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: tecnico ?? { activo: true } });
  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={handleSubmit(async (data) => {
        await guardar.mutateAsync({ id: tecnico?.id, data });
        onDone();
      })}
    >
      {guardar.error && <Alert tone="danger">{guardar.error.message}</Alert>}
      <Input label="Nombre completo" error={errors.nombre?.message} {...register('nombre')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Documento" error={errors.documento?.message} {...register('documento')} />
        <Input label="Teléfono" error={errors.telefono?.message} {...register('telefono')} />
      </div>
      <Input label="Correo" type="email" error={errors.email?.message} {...register('email')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Zona de cobertura" error={errors.zona?.message} {...register('zona')} />
        <Input
          label="Especialidad"
          error={errors.especialidad?.message}
          {...register('especialidad')}
        />
      </div>
      <Checkbox label="Activo" {...register('activo')} />
      <div className="flex justify-end">
        <Button type="submit" disabled={guardar.isPending}>
          Guardar
        </Button>
      </div>
    </form>
  );
}

export function PersonalPage() {
  const { data, isLoading, error } = useTecnicos();
  const { puede } = useAuth();
  const [nuevo, setNuevo] = useState(false);
  return (
    <>
      <PageHeader
        title="Personal técnico"
        subtitle="Quién atiende, dónde, cuándo y qué hizo"
        actions={
          puede('personal:editar') && (
            <Button onClick={() => setNuevo(true)}>
              <Plus size={16} /> Nuevo técnico
            </Button>
          )
        }
      />
      <Card>
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <Table<Tecnico>
            rows={data ?? []}
            rowKey={(t) => t.id}
            columns={[
              {
                header: 'Nombre',
                cell: (t) => (
                  <Link
                    to={`/personal/${t.id}`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {t.nombre}
                  </Link>
                ),
              },
              { header: 'Zona', cell: (t) => t.zona },
              { header: 'Especialidad', cell: (t) => t.especialidad },
              { header: 'Teléfono', cell: (t) => t.telefono },
              {
                header: 'Estado',
                cell: (t) => (
                  <Badge tone={t.activo ? 'green' : 'gray'}>
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                ),
              },
            ]}
          />
        )}
      </Card>
      <Modal open={nuevo} title="Nuevo técnico" onClose={() => setNuevo(false)}>
        {nuevo && <TecnicoForm onDone={() => setNuevo(false)} />}
      </Modal>
    </>
  );
}
