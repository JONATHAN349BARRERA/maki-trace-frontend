import { useParams } from 'react-router';
import { ErrorState, Loading } from '@/shared/ui';
import { useEquipoPorSerial } from '../api';
import { HojaDeVida } from './HojaDeVidaPage';

/** Destino del QR pegado en el equipo: /equipos/serial/:serial */
export function EquipoPorSerialPage() {
  const { serial = '' } = useParams();
  const { data, isLoading, error } = useEquipoPorSerial(serial);
  if (isLoading) return <Loading label="Buscando equipo…" />;
  if (error || !data) return <ErrorState error={error} />;
  return <HojaDeVida equipo={data} />;
}
