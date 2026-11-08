import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router';
import { useClientes } from '@/modules/clientes/api';
import { Alert, Button, Card, Checkbox, Input, Loading, PageHeader, Select, Textarea } from '@/shared/ui';
import { useContrato, useGuardarContrato } from '../api';
import { COMPONENTE_LABEL, COMPONENTES, type Componente } from '../types';

export const contratoSchema = z
  .object({
    numero: z.string().trim().min(3, 'Ingrese el número del contrato'),
    clienteId: z.string().min(1, 'Seleccione el cliente'),
    modalidad: z.enum(['arriendo', 'posventa']),
    fechaInicio: z.string().min(1, 'Fecha requerida'),
    fechaFin: z.string().min(1, 'Fecha requerida'),
    valor: z.coerce.number<number>().positive('El valor debe ser mayor que cero'),
    componentes: z.array(z.enum(['preventivo', 'correctivo', 'repuestos', 'suministros'])).min(1, 'Seleccione al menos un componente'),
    observaciones: z.string().optional(),
  })
  .refine((d) => d.fechaFin >= d.fechaInicio, { path: ['fechaFin'], message: 'Debe ser posterior al inicio' });

type Form = z.infer<typeof contratoSchema>;

export function ContratoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const clientes = useClientes();
  const existente = useContrato(id ?? '');
  const guardar = useGuardarContrato();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(contratoSchema),
    defaultValues: { modalidad: 'arriendo', componentes: [...COMPONENTES], numero: '', clienteId: '', fechaInicio: '', fechaFin: '', observaciones: '' },
  });

  useEffect(() => {
    if (id && existente.data) {
      const { numero, clienteId, modalidad, fechaInicio, fechaFin, valor, componentes, observaciones } = existente.data;
      reset({ numero, clienteId, modalidad, fechaInicio, fechaFin, valor, componentes, observaciones });
    }
  }, [id, existente.data, reset]);

  if (id && existente.isLoading) return <Loading />;

  const onSubmit = handleSubmit(async (data) => {
    const c = await guardar.mutateAsync({ id, data });
    navigate(`/contratos/${c.id}`);
  });

  return (
    <>
      <PageHeader backTo={id ? `/contratos/${id}` : '/contratos'} title={id ? 'Editar contrato' : 'Nuevo contrato'} />
      <Card>
        <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {guardar.error && (
            <div className="sm:col-span-2">
              <Alert tone="danger">{guardar.error.message}</Alert>
            </div>
          )}
          <Input label="Número de contrato" placeholder="ARR-2026-007" error={errors.numero?.message} {...register('numero')} />
          <Select
            label="Cliente"
            placeholder="Seleccione…"
            error={errors.clienteId?.message}
            options={(clientes.data ?? []).map((c) => ({ value: c.id, label: c.razonSocial }))}
            {...register('clienteId')}
          />
          <Select
            label="Modalidad"
            options={[
              { value: 'arriendo', label: 'Arriendo con mantenimiento y repuestos' },
              { value: 'posventa', label: 'Posventa (equipo vendido)' },
            ]}
            {...register('modalidad')}
          />
          <Input label="Valor (COP)" type="number" min={0} hint="Arriendo: cuota mensual por equipo" error={errors.valor?.message} {...register('valor')} />
          <Input label="Fecha de inicio" type="date" error={errors.fechaInicio?.message} {...register('fechaInicio')} />
          <Input label="Fecha de fin" type="date" error={errors.fechaFin?.message} {...register('fechaFin')} />
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium text-slate-700">Componentes incluidos</legend>
            <Controller
              control={control}
              name="componentes"
              render={({ field }) => (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {COMPONENTES.map((c) => (
                    <Checkbox
                      key={c}
                      label={COMPONENTE_LABEL[c]}
                      checked={field.value.includes(c)}
                      onChange={(e) =>
                        field.onChange(
                          e.target.checked ? [...field.value, c] : field.value.filter((x: Componente) => x !== c),
                        )
                      }
                    />
                  ))}
                </div>
              )}
            />
            {errors.componentes && <p className="mt-1 text-xs text-red-600">{errors.componentes.message}</p>}
          </fieldset>
          <Textarea label="Observaciones" className="sm:col-span-2" {...register('observaciones')} />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardar.isPending}>
              {guardar.isPending ? 'Guardando…' : 'Guardar contrato'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
