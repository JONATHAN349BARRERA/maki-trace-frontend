import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../utils';

describe('Recorrido de pantallas por rol', () => {
  it.each([
    ['/', 'gerente', 'Tablero'],
    ['/contratos', 'gerente', 'Contratos'],
    ['/contratos/con-1', 'gerente', 'Contrato ARR-2025-001'],
    ['/equipos', 'gestor', 'Equipos'],
    ['/equipos/eq-1', 'gestor', 'Toshiba e-STUDIO 3018A'],
    ['/equipos/serial/CNFM88010', 'tecnico', 'Toshiba e-STUDIO 5018A'],
    ['/inventario', 'gerente', 'Repuestos y suministros'],
    ['/inventario/it-1', 'gestor', 'Tóner T-3018 negro'],
    ['/personal', 'gerente', 'Personal técnico'],
    ['/personal/tec-1', 'gerente', 'Carlos Ramírez'],
    ['/clientes', 'gerente', 'Clientes'],
    ['/cartera', 'gerente', 'Cartera'],
    ['/alertas', 'gestor', 'Alertas'],
    ['/admin/usuarios', 'gerente', 'Usuarios y roles'],
    ['/escanear', 'tecnico', 'Escanear equipo'],
    ['/portal', 'cliente', 'Hola, María'],
    ['/casos', 'cliente', 'Mis solicitudes'],
    ['/equipos', 'cliente', 'Mis equipos'],
    ['/no-existe', 'gerente', 'Página no encontrada'],
  ] as const)('%s (%s)', async (ruta, rol, titulo) => {
    renderApp(ruta, rol);
    expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeInTheDocument();
  });

  it.each(['casos', 'personal', 'inventario', 'contratos', 'cartera'])(
    'informe de %s',
    async (tab) => {
      renderApp(`/informes?tab=${tab}`, 'gerente');
      expect(await screen.findByRole('tab', { selected: true })).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByText('Cargando…')).not.toBeInTheDocument());
    },
  );

  it('el gestor solo ve el informe de casos; el técnico va a su vista', async () => {
    renderApp('/informes', 'gestor');
    expect(await screen.findByRole('tab', { name: 'Casos' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Cartera' })).not.toBeInTheDocument();
  });

  it('redirige al técnico desde el inicio a "Mis casos"', async () => {
    const { router } = renderApp('/', 'tecnico');
    await waitFor(() => expect(router.state.location.pathname).toBe('/tecnico'));
  });

  it('un cliente no ve equipos de otros clientes', async () => {
    renderApp('/equipos/eq-4', 'cliente');
    expect(await screen.findByText('Equipo no encontrado.')).toBeInTheDocument();
  });
});

describe('Formularios', () => {
  it('crea un contrato y valida fechas', async () => {
    const { user } = renderApp('/contratos/nuevo', 'gerente');
    await screen.findByRole('option', { name: 'Copias Express Chapinero' });
    await user.type(screen.getByLabelText('Número de contrato'), 'ARR-2026-099');
    await user.selectOptions(screen.getByLabelText('Cliente'), 'cli-5');
    await user.type(screen.getByLabelText('Valor (COP)'), '500000');
    await user.type(screen.getByLabelText('Fecha de inicio'), '2026-12-01');
    await user.type(screen.getByLabelText('Fecha de fin'), '2026-01-01');
    await user.click(screen.getByLabelText('Suministros'));
    await user.click(screen.getByRole('button', { name: 'Guardar contrato' }));
    expect(await screen.findByText('Debe ser posterior al inicio')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Fecha de fin'));
    await user.type(screen.getByLabelText('Fecha de fin'), '2027-12-01');
    await user.click(screen.getByRole('button', { name: 'Guardar contrato' }));
    expect(
      await screen.findByRole('heading', { name: 'Contrato ARR-2026-099' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('No incluido')).toBeInTheDocument();
  });

  it('edita un contrato existente', async () => {
    const { user } = renderApp('/contratos/con-2/editar', 'gerente');
    const obs = await screen.findByLabelText('Observaciones');
    await waitFor(() => expect(obs).toHaveValue('Equipo vendido. Solo mantenimiento.'));
    await user.clear(obs);
    await user.type(obs, 'Renovado');
    await user.click(screen.getByRole('button', { name: 'Guardar contrato' }));
    expect(await screen.findByText('Renovado')).toBeInTheDocument();
  });

  it('crea un equipo, registra lectura de contador y muestra su QR', async () => {
    const { user } = renderApp('/equipos/nuevo', 'gestor');
    await screen.findByRole('option', { name: /ARR-2026-006/ });
    await user.type(screen.getByLabelText('Serial'), 'cnzz10001');
    await user.selectOptions(screen.getByLabelText('Modelo'), 'e-STUDIO 4518A');
    await user.type(screen.getByLabelText('Velocidad (ppm)'), '45');
    await user.type(screen.getByLabelText('Características'), 'Equipo de alto volumen');
    await user.selectOptions(screen.getByLabelText('Contrato asociado'), 'con-6');
    await user.type(screen.getByLabelText('Ubicación'), 'Sede norte, recepción');
    await user.type(screen.getByLabelText('Fecha de instalación'), '2026-11-01');
    await user.type(screen.getByLabelText('Garantía hasta'), '2027-11-01');
    await user.click(screen.getByRole('button', { name: 'Guardar equipo' }));
    expect(await screen.findByText('Serial CNZZ10001 · Sede norte, recepción')).toBeInTheDocument();
    expect(screen.getByTitle('QR del equipo CNZZ10001')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nueva lectura'), '1500');
    await user.click(screen.getByRole('button', { name: 'Registrar' }));
    expect((await screen.findAllByText('1.500')).length).toBeGreaterThan(0);
  });

  it('el técnico busca un equipo por serial', async () => {
    const { user, router } = renderApp('/escanear', 'tecnico');
    await user.type(await screen.findByLabelText('Serial'), 'cncj71234');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/equipos/serial/CNCJ71234'));
    expect(await screen.findByText('Último mantenimiento')).toBeInTheDocument();
  });

  it('crea un ítem de inventario y registra una entrada', async () => {
    const { user } = renderApp('/inventario', 'gestor');
    await user.click(await screen.findByRole('button', { name: /Nuevo ítem/ }));
    let d = await screen.findByRole('dialog');
    await user.type(within(d).getByLabelText('Código'), 'T-NEW');
    await user.selectOptions(within(d).getByLabelText('Tipo'), 'suministro');
    await user.type(within(d).getByLabelText('Nombre'), 'Tóner de prueba');
    await user.type(await within(d).findByLabelText('Rendimiento (copias por unidad)'), '30000');
    await user.click(within(d).getByLabelText('e-STUDIO 3018A'));
    await user.click(within(d).getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('link', { name: 'T-NEW' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'T-NEW' }));
    await user.click(await screen.findByRole('button', { name: 'Registrar movimiento' }));
    d = await screen.findByRole('dialog');
    await user.type(within(d).getByLabelText('Cantidad'), '10');
    await user.click(within(d).getByRole('button', { name: 'Registrar movimiento' }));
    expect(await screen.findByText('entrada')).toBeInTheDocument();
  });

  it('crea un cliente y un técnico', async () => {
    const { user } = renderApp('/clientes', 'gerente');
    await user.click(await screen.findByRole('button', { name: /Nuevo cliente/ }));
    const d = await screen.findByRole('dialog');
    for (const [label, v] of [
      ['Razón social', 'Colegio Nuevo'],
      ['NIT', '900000001'],
      ['Contacto', 'Ana'],
      ['Teléfono', '3000000000'],
      ['Correo', 'ana@colegio.co'],
      ['Dirección', 'Cl 1 # 2-3'],
      ['Ciudad', 'Bogotá'],
    ]) {
      await user.type(within(d).getByLabelText(label!), v!);
    }
    await user.click(within(d).getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Colegio Nuevo')).toBeInTheDocument();
  });

  it('registra un técnico nuevo', async () => {
    const { user } = renderApp('/personal', 'gerente');
    await user.click(await screen.findByRole('button', { name: /Nuevo técnico/ }));
    const d = await screen.findByRole('dialog');
    for (const [label, v] of [
      ['Nombre completo', 'Pedro Pérez'],
      ['Documento', '123456'],
      ['Teléfono', '3001112222'],
      ['Correo', 'pedro@maki.co'],
      ['Zona de cobertura', 'Cali'],
      ['Especialidad', 'General'],
    ]) {
      await user.type(within(d).getByLabelText(label!), v!);
    }
    await user.click(within(d).getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('link', { name: 'Pedro Pérez' })).toBeInTheDocument();
  });

  it('administra usuarios: valida y crea un usuario cliente', async () => {
    const { user } = renderApp('/admin/usuarios', 'gerente');
    await user.click(await screen.findByRole('button', { name: /Nuevo usuario/ }));
    const d = await screen.findByRole('dialog');
    await user.type(within(d).getByLabelText('Nombre'), 'Paola Ríos');
    await user.type(within(d).getByLabelText('Usuario'), 'paola');
    await user.type(within(d).getByLabelText('Correo'), 'paola@copias.co');
    await user.selectOptions(within(d).getByLabelText('Rol'), 'cliente');
    await user.click(within(d).getByRole('button', { name: 'Guardar' }));
    expect(await within(d).findByText('Seleccione la organización')).toBeInTheDocument();
    await screen.findByRole('option', { name: 'Copias Express Chapinero' });
    await user.selectOptions(within(d).getByLabelText('Organización'), 'cli-5');
    await user.click(within(d).getByRole('button', { name: 'Guardar' }));
    expect(await within(d).findByText('Mínimo 8 caracteres')).toBeInTheDocument();
    await user.type(within(d).getByLabelText('Contraseña'), 'clave-segura');
    await user.click(within(d).getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('paola@copias.co')).toBeInTheDocument();
  });

  it('cartera: registra un pago y genera facturación', async () => {
    const { user } = renderApp('/cartera', 'gerente');
    const pagos = await screen.findAllByRole('button', { name: 'Registrar pago' });
    const antes = pagos.length;
    await user.click(pagos[0]!);
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Registrar pago' })).toHaveLength(antes - 1),
    );
    await user.clear(screen.getByLabelText('Periodo'));
    await user.type(screen.getByLabelText('Periodo'), '2026-12');
    await user.click(screen.getByRole('button', { name: 'Generar' }));
    expect(await screen.findByText(/Se generaron \d+ facturas/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Generar' }));
    expect(await screen.findByText('No hay facturas nuevas para ese periodo.')).toBeInTheDocument();
  });
});
