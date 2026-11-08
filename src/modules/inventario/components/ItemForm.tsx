import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MODELOS } from '@/modules/equipos/domain/modelos';
import { Alert, Button, Checkbox, Input, Select } from '@/shared/ui';
import { useGuardarItem } from '../api';
import type { Item } from '../types';

const schema = z.object({
  codigo: z.string().trim().min(2, 'Código requerido'),
  nombre: z.string().trim().min(3, 'Nombre requerido'),
  tipo: z.enum(['repuesto', 'suministro']),
  costoUnitario: z.coerce.number<number>().nonnegative('Debe ser ≥ 0'),
  minimo: z.coerce.number<number>().int().nonnegative('Debe ser ≥ 0'),
  existencias: z.coerce.number<number>().int().nonnegative().optional(),
  rendimientoCopias: z.coerce.number<number>().int().nonnegative().optional(),
  modelosCompatibles: z.array(z.string()).min(1, 'Seleccione al menos un modelo'),
});
type Form = z.infer<typeof schema>;

export function ItemForm({ item, onDone }: { item?: Item; onDone: () => void }) {
  const guardar = useGuardarItem();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: item ?? { tipo: 'repuesto', modelosCompatibles: [], existencias: 0, minimo: 1, costoUnitario: 0 },
  });
  const tipo = watch('tipo');
  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={handleSubmit(async ({ rendimientoCopias, ...data }) => {
        await guardar.mutateAsync({
          id: item?.id,
          data: { ...data, rendimientoCopias: data.tipo === 'suministro' && rendimientoCopias ? rendimientoCopias : undefined },
        });
        onDone();
      })}
    >
      {guardar.error && <Alert tone="danger">{guardar.error.message}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Código" error={errors.codigo?.message} {...register('codigo')} />
        <Select label="Tipo" options={[{ value: 'repuesto', label: 'Repuesto' }, { value: 'suministro', label: 'Suministro' }]} {...register('tipo')} />
      </div>
      <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Costo unitario (COP)" type="number" error={errors.costoUnitario?.message} {...register('costoUnitario')} />
        <Input label="Existencia mínima" type="number" error={errors.minimo?.message} {...register('minimo')} />
      </div>
      {!item && <Input label="Existencias iniciales" type="number" {...register('existencias')} />}
      {tipo === 'suministro' && (
        <Input label="Rendimiento (copias por unidad)" type="number" hint="Se usa para detectar consumos anómalos" {...register('rendimientoCopias')} />
      )}
      <fieldset>
        <legend className="mb-1 text-sm font-medium text-slate-700">Modelos compatibles</legend>
        <div className="grid grid-cols-2 gap-1">
          {MODELOS.map((m) => (
            <Checkbox key={m} label={m} value={m} {...register('modelosCompatibles')} />
          ))}
        </div>
        {errors.modelosCompatibles && <p className="mt-1 text-xs text-red-600">{errors.modelosCompatibles.message}</p>}
      </fieldset>
      <div className="flex justify-end">
        <Button type="submit" disabled={guardar.isPending}>Guardar</Button>
      </div>
    </form>
  );
}
