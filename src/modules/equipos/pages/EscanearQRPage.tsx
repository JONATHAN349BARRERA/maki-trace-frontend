import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Camera } from 'lucide-react';
import { Alert, Button, Card, Input, PageHeader } from '@/shared/ui';
import { rutaQR, serialDesdeQR } from '../domain/equipo';

/**
 * El técnico escanea el QR del equipo con la cámara del celular y abre su hoja de
 * vida. Si la cámara no está disponible, puede digitar el serial.
 */
export function EscanearQRPage() {
  const navigate = useNavigate();
  const [activo, setActivo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serial, setSerial] = useState('');
  const scannerRef = useRef<{ stop: () => Promise<void>; isScanning?: boolean } | null>(null);

  useEffect(() => {
    if (!activo) return;
    let cancelado = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelado) return;
        const scanner = new Html5Qrcode('lector-qr');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 240 },
          (texto) => {
            const s = serialDesdeQR(texto);
            if (s) {
              scanner.stop().catch(() => undefined);
              navigate(rutaQR(s));
            }
          },
          () => undefined,
        );
      } catch {
        setError('No fue posible acceder a la cámara. Verifique los permisos o digite el serial.');
        setActivo(false);
      }
    })();
    return () => {
      cancelado = true;
      const s = scannerRef.current;
      if (s?.isScanning) s.stop().catch(() => undefined);
    };
  }, [activo, navigate]);

  return (
    <>
      <PageHeader title="Escanear equipo" subtitle="Lea el código QR pegado en el multifuncional" />
      <div className="mx-auto max-w-md space-y-4">
        <Card>
          <div id="lector-qr" className="overflow-hidden rounded-lg bg-slate-900" style={{ minHeight: activo ? 280 : 0 }} />
          {!activo && (
            <Button className="w-full" onClick={() => { setError(null); setActivo(true); }}>
              <Camera size={16} /> Activar cámara
            </Button>
          )}
          {error && <div className="mt-3"><Alert tone="warning">{error}</Alert></div>}
        </Card>
        <Card title="O digite el serial">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const s = serialDesdeQR(serial);
              if (s) navigate(rutaQR(s));
              else setError('Serial inválido.');
            }}
          >
            <Input label="Serial" value={serial} onChange={(e) => setSerial(e.target.value.toUpperCase())} className="flex-1" />
            <Button type="submit">Buscar</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
