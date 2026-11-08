import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { Alert, Button, Card, ErrorState, Input, Loading, Modal, PageHeader, Select, Table } from '@/shared/ui';
import { useClientes, useGuardarCliente } from '../api';
import { TIPO_CLIENTE_LABEL, type Cliente } from '../types';

const schema = z.object({
  nit: z.string().trim().min(5, 'NIT requerido'),
  razonSocial: z.string().trim().min(2, 'Razón social requerida'),
  tipo: z.enum(['papeleria', 'educativa', 'empresa']),
  contacto: z.string().trim().min(2, 'Contacto requerido'),
  telefono: z.string().trim().min(7, 'Teléfono inválido'),
  email: z.email('Correo inválido'),
  direccion: z.string().trim().min(3, 'Dirección requerida'),
  ciudad: z.string().trim().min(2, 'Ciudad requerida'),
});
type Form = z.infer<typeof schema>;

function ClienteForm({ cliente, onDone }: { cliente?: Cliente; onDone: () => void }) {
  const guardar = useGuardarCliente();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: cliente ?? { tipo: 'empresa' } });
  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (data) => {
        await guardar.mutateAsync({ id: cliente?.id, data });
        onDone();
      })}
      className="space-y-3"
    >
      {guardar.error && <Alert tone="danger">{guardar.error.message}</Alert>}
      <Input label="Razón social" error={errors.razonSocial?.message} {...register('razonSocial')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="NIT" error={errors.nit?.message} {...register('nit')} />
        <Select
          label="Tipo"
          options={Object.entries(TIPO_CLIENTE_LABEL).map(([value, label]) => ({ value, label }))}
          {...register('tipo')}
        />
      </div>
      <Input label="Contacto" error={errors.contacto?.message} {...register('contacto')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Teléfono" error={errors.telefono?.message} {...register('telefono')} />
        <Input label="Correo" type="email" error={errors.email?.message} {...register('email')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Dirección" error={errors.direccion?.message} {...register('direccion')} />
        <Input label="Ciudad" error={errors.ciudad?.message} {...register('ciudad')} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={guardar.isPending}>
          Guardar
        </Button>
      </div>
    </form>
  );
}

export function ClientesPage() {
  const { data, isLoading, error } = useClientes();
  const { puede } = useAuth();
  const [editando, setEditando] = useState<Cliente | 'nuevo' | null>(null);
  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Papelerías, instituciones educativas y empresas"
        actions={
          puede('clientes:editar') && (
            <Button onClick={() => setEditando('nuevo')}>
              <Plus size={16} /> Nuevo cliente
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
          <Table
            rows={data ?? []}
            rowKey={(c) => c.id}
            columns={[
              { header: 'Razón social', cell: (c) => <span className="font-medium">{c.razonSocial}</span> },
              { header: 'NIT', cell: (c) => c.nit },
              { header: 'Tipo', cell: (c) => TIPO_CLIENTE_LABEL[c.tipo] },
              { header: 'Contacto', cell: (c) => `${c.contacto} · ${c.telefono}` },
              { header: 'Ciudad', cell: (c) => c.ciudad },
              {
                header: '',
                cell: (c) =>
                  puede('clientes:editar') && (
                    <Button size="sm" variant="ghost" onClick={() => setEditando(c)} aria-label={`Editar ${c.razonSocial}`}>
                      <Pencil size={14} />
                    </Button>
                  ),
              },
            ]}
          />
        )}
      </Card>
      <Modal open={editando !== null} title={editando === 'nuevo' ? 'Nuevo cliente' : 'Editar cliente'} onClose={() => setEditando(null)}>
        {editando !== null && (
          <ClienteForm cliente={editando === 'nuevo' ? undefined : editando} onDone={() => setEditando(null)} />
        )}
      </Modal>
    </>
  );
}
