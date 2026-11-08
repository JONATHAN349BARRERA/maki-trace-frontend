import { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { resizeImage } from '@/shared/lib/image';
import { Alert, Button } from '@/shared/ui';
import { useFotosEquipo } from '../api';

export function FotosEquipo({ equipoId, fotos, editable }: { equipoId: string; fotos: string[]; editable: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const { subir, eliminar } = useFotosEquipo(equipoId);
  return (
    <div>
      {fotos.length === 0 ? (
        <p className="text-sm text-slate-500">Sin fotos registradas.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {fotos.map((f) => (
            <li key={f} className="relative">
              <img src={f} alt="Foto del equipo" className="aspect-square w-full rounded-lg object-cover ring-1 ring-slate-200" />
              {editable && (
                <button
                  type="button"
                  aria-label="Eliminar foto"
                  onClick={() => eliminar.mutate(f.split('/').pop() ?? '')}
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-700 shadow"
                >
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <>
          <input
            ref={input}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            aria-label="Seleccionar foto"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) subir.mutate(await resizeImage(file));
              e.target.value = '';
            }}
          />
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => input.current?.click()} disabled={subir.isPending}>
            <Camera size={14} /> {subir.isPending ? 'Subiendo…' : 'Agregar foto'}
          </Button>
          {subir.error && <Alert tone="danger">{subir.error.message}</Alert>}
        </>
      )}
    </div>
  );
}
