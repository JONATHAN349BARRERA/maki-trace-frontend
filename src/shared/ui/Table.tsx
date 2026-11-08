import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  empty = 'No hay registros.',
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: string;
  caption?: string;
}) {
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-slate-50">
          <tr>
            {columns.map((c) => (
              <th
                key={c.header}
                scope="col"
                className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={rowKey(r)} className="hover:bg-slate-50">
                {columns.map((c) => (
                  <td
                    key={c.header}
                    className={c.className ?? 'whitespace-nowrap px-4 py-2 text-slate-700'}
                  >
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
