import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../utils';

describe('Inicio de sesión', () => {
  it('rechaza credenciales inválidas y lleva a cada rol a su vista', async () => {
    const { user, router } = renderApp('/');
    await user.type(await screen.findByLabelText('Usuario'), 'gerente');
    await user.type(screen.getByLabelText('Contraseña'), 'mala');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Usuario o contraseña incorrectos.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cliente (Colegio San Ángel)' }));
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Hola, María')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/portal');
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('valida campos vacíos', async () => {
    const { user } = renderApp('/login');
    await user.click(await screen.findByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Ingrese su usuario')).toBeInTheDocument();
  });

  it('impide acceder a secciones de otro rol', async () => {
    renderApp('/cartera', 'tecnico');
    expect(await screen.findByText('Acceso restringido')).toBeInTheDocument();
  });
});

describe('Tarea del cliente: registrar una solicitud de autogestión', () => {
  it('crea un caso con consecutivo y puede consultar su estado', async () => {
    const { user } = renderApp('/portal/solicitud', 'cliente');
    await screen.findByRole('option', { name: /CNCJ71301/ });
    await user.selectOptions(screen.getByLabelText('Equipo'), 'eq-8');
    await user.click(screen.getByText('Suministros'));
    await user.click(await screen.findByLabelText('Tóner T-3018 negro'));
    await user.type(screen.getByLabelText('Contador de copias actual (opcional)'), '20000');
    await user.type(screen.getByLabelText('Descripción'), 'Se acabó el tóner del equipo.');
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
    expect(await screen.findByRole('heading', { name: 'Caso CASO-2026-0014' })).toBeInTheDocument();
    expect(screen.getAllByText('Registrado').length).toBeGreaterThan(0);
  });

  it('valida el formulario y advierte si el contrato no cubre lo solicitado', async () => {
    const { user } = renderApp('/portal/solicitud', 'cliente2');
    await user.click(await screen.findByRole('button', { name: 'Enviar solicitud' }));
    expect(await screen.findByText('Seleccione el equipo.')).toBeInTheDocument();
    await screen.findByRole('option', { name: /CNEK45001/ });
    await user.selectOptions(screen.getByLabelText('Equipo'), 'eq-3');
    await user.click(screen.getByText('Repuestos'));
    expect(await screen.findByText(/no incluye repuestos/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Descripción'), 'Ruido');
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
    expect(
      await screen.findByText('Agregue al menos un repuesto o suministro.'),
    ).toBeInTheDocument();
  });
});

describe('Tarea del gestor: aprobar, rechazar y asignar', () => {
  it('asigna un técnico a un caso aprobado', async () => {
    const { user } = renderApp('/casos', 'gestor');
    await user.selectOptions(await screen.findByLabelText('Estado'), 'aprobado');
    await user.click(await screen.findByRole('link', { name: 'CASO-2026-0009' }));
    await user.click(await screen.findByRole('button', { name: 'Asignar técnico' }));
    const d = await screen.findByRole('dialog');
    await user.selectOptions(await within(d).findByLabelText('Técnico'), 'tec-3');
    await user.click(within(d).getByRole('button', { name: 'Asignar' }));
    expect(await screen.findByText('Asignado a Hernán Velásquez')).toBeInTheDocument();
  });

  it('rechaza una solicitud con motivo y filtra demorados', async () => {
    const { user } = renderApp('/casos', 'gestor');
    await user.click(await screen.findByLabelText('Solo demorados'));
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'CASO-2026-0013' })).not.toBeInTheDocument(),
    );
    await user.click(screen.getByLabelText('Solo demorados'));
    await user.click(await screen.findByRole('link', { name: 'CASO-2026-0013' }));
    await user.click(await screen.findByRole('button', { name: 'Rechazar' }));
    const d = await screen.findByRole('dialog');
    await user.type(within(d).getByLabelText('Motivo del rechazo'), 'Solicitud duplicada');
    await user.click(within(d).getByRole('button', { name: 'Rechazar' }));
    expect(await screen.findByText('Solicitud rechazada')).toBeInTheDocument();
  });

  it('el técnico inicia la atención de un caso asignado', async () => {
    const { user } = renderApp('/tecnico', 'tecnico');
    await user.click(await screen.findByText('CASO-2026-0008'));
    await user.click(await screen.findByRole('button', { name: 'Iniciar atención' }));
    expect(await screen.findByText('Inicio de la atención en sitio')).toBeInTheDocument();
  });
});
