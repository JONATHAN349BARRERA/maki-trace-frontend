import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * Paleta categórica validada (orden fijo, nunca cíclico): azul y naranja tienen
 * separación suficiente incluso con daltonismo. Ver docs/ARQUITECTURA.md.
 */
export const SERIES = ['#2a78d6', '#eb6834'] as const;
const EJE = { fontSize: 12, fill: '#52514e' };

export interface Serie<T> {
  key: keyof T & string;
  label: string;
}

/** Barras verticales delgadas con extremos redondeados, tooltip y leyenda (≥ 2 series). */
export function BarrasChart<T extends object>({
  data,
  x,
  series,
  formato = (v: number) => String(v),
  alto = 260,
  titulo,
}: {
  data: T[];
  x: keyof T & string;
  series: Serie<T>[];
  formato?: (v: number) => string;
  alto?: number;
  titulo: string;
}) {
  return (
    <figure aria-label={titulo} className="w-full">
      <ResponsiveContainer width="100%" height={alto}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          barGap={2}
          barCategoryGap="30%"
        >
          <CartesianGrid vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey={x as string}
            tick={{ ...EJE, fontSize: 11 }}
            interval={0}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            tick={EJE}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formato(v)}
            width={70}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(15, 61, 104, 0.06)' }}
            formatter={(v) => formato(Number(v))}
            contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
          />
          {series.length > 1 && (
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#52514e' }} />
          )}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key as string}
              name={s.label}
              fill={SERIES[i % SERIES.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
