import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useUsuario } from '@/modules/auth/AuthContext';
import { useEquipos, equiposApi } from '@/modules/equipos/api';
import { useItems } from '@/modules/inventario/api';
import { formatNumber } from '@/shared/lib/format';
import { Alert, Button, Card, Input, PageHeader, Select, Textarea } from '@/shared/ui';
import { casosApi, useAccionCaso } from '../api';
import { TIPO_CASO_LABEL, type Advertencia, type ItemCantidad, type TipoCaso } from '../types';

/**
 * Formulario de autogestión: el cliente registra su solicitud (falla,
 * mantenimiento, repuestos o suministros) y se abre un caso con consecutivo.
 */
export function NuevaSolicitudPage() {
  const usuario = useUsuario();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const equipos = useEquipos();
  const [equipoId, setEquipoId] = useState(params.get('equipoId') ?? '');
  const [tipo, setTipo] = useState<TipoCaso>('falla');
  const [descripcion, setDescripcion] = useState('');
  const [items, setItems] = useState<ItemCantidad[]>([]);
  const [contador, setContador] = useState('');
  const [avisos, setAvisos] = useState<Advertencia[]>([]);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const equipo = equipos.data?.find((e) => e.id === equipoId);
  const catalogo = useItems(equipo?.modelo);
  const pideItems = tipo === 'repuesto' || tipo === 'suministro';
  const opcionesItems = (catalogo.data ?? []).filter(
    (i) => i.tipo === (tipo === 'repuesto' ? 'repuesto' : 'suministro'),
  );
  const equiposConContrato = (equipos.data ?? []).filter((e) => e.contratoId);

  // Pre-validación: se informa al cliente si su contrato no cubre lo que solicita.
  useEffect(() => {
    if (!equipoId) return;
    let vigente = true;
    casosApi
      .prevalidar({ equipoId, tipo, descripcion: '', itemsSolicitados: pideItems ? items : [] })
      .then(
        (a) =>
          vigente &&
          setAvisos(a.filter((x) => x.codigo === 'sin_cobertura' || x.codigo === 'incompatible')),
      )
      .catch(() => vigente && setAvisos([]));
    return () => {
      vigente = false;
    };
  }, [equipoId, tipo, items, pideItems]);

  const crear = useAccionCaso(async () => {
    if (contador && equipo) await equiposApi.registrarLectura(equipo.id, Number(contador));
    return casosApi.crear({
      equipoId,
      tipo,
      descripcion,
      itemsSolicitados: pideItems ? items : [],
    });
  });

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm(null);
    if (!equipoId) return setErrorForm('Seleccione el equipo.');
    if (descripcion.trim().length < 5)
      return setErrorForm('Describa la solicitud (mínimo 5 caracteres).');
    if (pideItems && items.length === 0)
      return setErrorForm('Agregue al menos un repuesto o suministro.');
    crear.mutate(undefined, {
      onSuccess: (caso) => navigate(`/casos/${caso.id}`, { state: { creado: true } }),
    });
  };

  return (
    <>
      <PageHeader
        backTo={usuario.rol === 'cliente' ? '/portal' : '/casos'}
        title="Nueva solicitud de servicio"
        subtitle="Registre su solicitud y haga seguimiento a su estado"
      />
      <Card>
        <form onSubmit={enviar} noValidate className="space-y-4">
          {(errorForm || crear.error) && (
            <Alert tone="danger">{errorForm ?? crear.error?.message}</Alert>
          )}
          <Select
            label="Equipo"
            placeholder="Seleccione el equipo…"
            value={equipoId}
            onChange={(e) => {
              setEquipoId(e.target.value);
              setItems([]);
            }}
            options={equiposConContrato.map((e) => ({
              value: e.id,
              label: `${e.serial} · ${e.modelo} · ${e.ubicacion}`,
            }))}
          />
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">¿Qué necesita?</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(TIPO_CASO_LABEL) as TipoCaso[]).map((t) => (
                <label
                  key={t}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-center text-sm ring-1 ${tipo === t ? 'bg-brand-50 font-semibold text-brand-700 ring-brand-500' : 'ring-slate-300 hover:bg-slate-50'}`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={t}
                    checked={tipo === t}
                    onChange={() => {
                      setTipo(t);
                      setItems([]);
                    }}
                    className="sr-only"
                  />
                  {TIPO_CASO_LABEL[t]}
                </label>
              ))}
            </div>
          </fieldset>
          {avisos.length > 0 && (
            <Alert tone="warning" title="Revise la cobertura de su contrato">
              {avisos.map((a) => (
                <p key={a.mensaje}>{a.mensaje}</p>
              ))}
              <p className="mt-1">Puede enviar la solicitud; el gestor de servicios la revisará.</p>
            </Alert>
          )}
          {pideItems && equipo && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">
                {tipo === 'repuesto' ? 'Repuestos' : 'Suministros'} compatibles con {equipo.modelo}
              </legend>
              <div className="space-y-2">
                {opcionesItems.map((i) => {
                  const sel = items.find((x) => x.itemId === i.id);
                  return (
                    <div key={i.id} className="flex items-center gap-3">
                      <label className="flex flex-1 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!sel}
                          onChange={(e) =>
                            setItems(
                              e.target.checked
                                ? [...items, { itemId: i.id, cantidad: 1 }]
                                : items.filter((x) => x.itemId !== i.id),
                            )
                          }
                        />
                        {i.nombre}
                      </label>
                      {sel && (
                        <input
                          type="number"
                          min={1}
                          aria-label={`Cantidad de ${i.nombre}`}
                          value={sel.cantidad}
                          onChange={(e) =>
                            setItems(
                              items.map((x) =>
                                x.itemId === i.id
                                  ? { ...x, cantidad: Math.max(1, Number(e.target.value) || 1) }
                                  : x,
                              ),
                            )
                          }
                          className="w-20 rounded-lg px-2 py-1 text-sm ring-1 ring-slate-300"
                        />
                      )}
                    </div>
                  );
                })}
                {opcionesItems.length === 0 && (
                  <p className="text-sm text-slate-500">No hay ítems compatibles registrados.</p>
                )}
              </div>
            </fieldset>
          )}
          {tipo === 'suministro' && equipo && (
            <Input
              label="Contador de copias actual (opcional)"
              type="number"
              min={equipo.contadorActual}
              hint={`Último registrado: ${formatNumber(equipo.contadorActual)}. Ayuda a validar el consumo.`}
              value={contador}
              onChange={(e) => setContador(e.target.value)}
            />
          )}
          <Textarea
            label="Descripción"
            placeholder="Describa la falla o lo que necesita"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={crear.isPending}>
              {crear.isPending ? 'Enviando…' : 'Enviar solicitud'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
