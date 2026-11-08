import { Badge } from '@/shared/ui';
import { ESTADO_TONE } from '../domain/flujo';
import { ESTADO_CASO_LABEL, type EstadoCaso } from '../types';

export function EstadoCasoBadge({ estado, demorado }: { estado: EstadoCaso; demorado?: boolean }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Badge tone={ESTADO_TONE[estado]}>{ESTADO_CASO_LABEL[estado]}</Badge>
      {demorado && <Badge tone="red">Demorado</Badge>}
    </span>
  );
}
