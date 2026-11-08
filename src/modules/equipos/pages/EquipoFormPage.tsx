import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router';
import { useContratos } from '@/modules/contratos/api';
import { Alert, Button, Card, Checkbox, Input, Loading, PageHeader, Select, Textarea } from '@/shared/ui';
import { useEquipo, useGuardarEquipo } from '../api';

import { MODELOS } from '../domain/modelos';

const schema = z.object({
  serial: z.string().trim().regex(/^[A-Za-z0-9-]{4,}$/, 'Serial inválido'),
  marca: z.string().trim().min(2),
  modelo: z.string().min(1, 'Seleccione el modelo'),
  caracteristicas: z.string().trim().min(5, 'Describa el equipo'),
  ppm: z.coerce.number<number>().int().positive('Requerido'),
  color: z.boolean(),
  duplex: z.boolean(),
  escaner: z.boolean(),
  formatos: z.string().min(1, 'Requerido'),
  contratoId: z.string(),
  ubicacion: z.string().trim().min(3, 'Indique la ubicación'),
  fechaInstalacion: z.string().min(1, 'Requerido'),
  garantiaHasta: z.string().min(1, 'Requerido'),
  contadorInicial: z.coerce.number<number>().int().min(0).optional(),
});
type Form = z.infer<typeof schema>;

export function EquipoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contratos = useContratos();
  const existente = useEquipo(id ?? '');
  const guardar = useGuardarEquipo();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { marca: 'Toshiba', modelo: '', color: false, duplex: true, escaner: true, formatos: 'Carta, Oficio, A4', contratoId: '', contadorInicial: 0 },
  });

  useEffect(() => {
    const e = existente.data;
    if (id && e) {
      reset({
        serial: e.serial, marca: e.marca, modelo: e.modelo, caracteristicas: e.caracteristicas,
        ppm: e.capacidades.ppm, color: e.capacidades.color, duplex: e.capacidades.duplex, escaner: e.capacidades.escaner,
        formatos: e.capacidades.formatos.join(', '), contratoId: e.contratoId ?? '', ubicacion: e.ubicacion,
        fechaInstalacion: e.fechaInstalacion, garantiaHasta: e.garantiaHasta,
      });
    }
  }, [id, existente.data, reset]);

  if (id && existente.isLoading) return <Loading />;

  const onSubmit = handleSubmit(async (f) => {
    const e = await guardar.mutateAsync({
      id,
      data: {
        serial: f.serial.toUpperCase(), marca: f.marca, modelo: f.modelo, caracteristicas: f.caracteristicas,
        capacidades: { ppm: f.ppm, color: f.color, duplex: f.duplex, escaner: f.escaner, formatos: f.formatos.split(',').map((x) => x.trim()).filter(Boolean) },
        contratoId: f.contratoId || null, ubicacion: f.ubicacion, fechaInstalacion: f.fechaInstalacion,
        garantiaHasta: f.garantiaHasta, contadorInicial: f.contadorInicial,
      },
    });
    navigate(`/equipos/${e.id}`);
  });

  return (
    <>
      <PageHeader backTo={id ? `/equipos/${id}` : '/equipos'} title={id ? 'Editar equipo' : 'Nuevo equipo'} />
      <Card>
        <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {guardar.error && <div className="sm:col-span-2"><Alert tone="danger">{guardar.error.message}</Alert></div>}
          <Input label="Serial" error={errors.serial?.message} {...register('serial')} disabled={!!id} />
          <Input label="Marca" {...register('marca')} />
          <Select label="Modelo" placeholder="Seleccione…" error={errors.modelo?.message} options={MODELOS.map((m) => ({ value: m, label: m }))} {...register('modelo')} />
          <Input label="Velocidad (ppm)" type="number" error={errors.ppm?.message} {...register('ppm')} />
          <Textarea label="Características" className="sm:col-span-2" error={errors.caracteristicas?.message} {...register('caracteristicas')} />
          <div className="flex flex-wrap gap-4 sm:col-span-2">
            <Checkbox label="Color" {...register('color')} />
            <Checkbox label="Dúplex" {...register('duplex')} />
            <Checkbox label="Escáner" {...register('escaner')} />
          </div>
          <Input label="Formatos (separados por coma)" error={errors.formatos?.message} {...register('formatos')} />
          <Select
            label="Contrato asociado"
            placeholder="Sin contrato (en bodega)"
            options={(contratos.data ?? []).map((c) => ({ value: c.id, label: `${c.numero} · ${c.clienteNombre}` }))}
            {...register('contratoId')}
          />
          <Input label="Ubicación" className="sm:col-span-2" error={errors.ubicacion?.message} {...register('ubicacion')} />
          <Input label="Fecha de instalación" type="date" error={errors.fechaInstalacion?.message} {...register('fechaInstalacion')} />
          <Input label="Garantía hasta" type="date" error={errors.garantiaHasta?.message} {...register('garantiaHasta')} />
          {!id && <Input label="Contador inicial" type="number" {...register('contadorInicial')} />}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" disabled={guardar.isPending}>Guardar equipo</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
