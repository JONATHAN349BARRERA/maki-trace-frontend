import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { Button } from '@/shared/ui';
import { urlQR } from '../domain/equipo';

/** Etiqueta QR asociada al serial del equipo, lista para imprimir y pegar. */
export function EquipoQR({ serial, modelo }: { serial: string; modelo: string }) {
  const imprimir = () => {
    const svg = document.getElementById(`qr-${serial}`)?.outerHTML ?? '';
    const w = window.open('', '_blank', 'width=400,height=500');
    if (!w) return;
    w.document.write(
      `<html><head><title>QR ${serial}</title></head><body style="font-family:sans-serif;text-align:center;padding:24px">${svg}<p style="font-weight:700;margin:8px 0 0">${serial}</p><p style="margin:0;font-size:12px">${modelo} · Maki Import Group</p><script>window.onload=()=>window.print()</script></body></html>`,
    );
    w.document.close();
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeSVG
        id={`qr-${serial}`}
        value={urlQR(serial)}
        size={160}
        level="M"
        marginSize={2}
        title={`QR del equipo ${serial}`}
      />
      <p className="text-xs text-slate-500">{serial}</p>
      <Button size="sm" variant="secondary" onClick={imprimir} className="no-print">
        <Printer size={14} /> Imprimir etiqueta
      </Button>
    </div>
  );
}
