import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat('es-CO');

export const formatCOP = (value: number) => cop.format(value);
export const formatNumber = (value: number) => num.format(value);

export const formatDate = (iso: string | undefined | null) =>
  iso ? format(parseISO(iso), 'dd/MM/yyyy', { locale: es }) : '—';

export const formatDateTime = (iso: string | undefined | null) =>
  iso ? format(parseISO(iso), 'dd/MM/yyyy HH:mm', { locale: es }) : '—';

export const formatHours = (hours: number) => {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} días`;
};
