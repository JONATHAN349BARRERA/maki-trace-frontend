import { Badge } from '@/shared/ui';
import { VIGENCIA_LABEL, VIGENCIA_TONE } from '../domain/vigencia';
import type { EstadoVigencia } from '../types';

export function VigenciaBadge({ estado, dias }: { estado: EstadoVigencia; dias?: number }) {
  const extra =
    dias !== undefined && estado === 'por_vencer'
      ? ` (${dias} d)`
      : dias !== undefined && estado === 'vencido'
        ? ` (hace ${-dias} d)`
        : '';
  return (
    <Badge tone={VIGENCIA_TONE[estado]}>
      {VIGENCIA_LABEL[estado]}
      {extra}
    </Badge>
  );
}
