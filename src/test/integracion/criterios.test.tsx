import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../utils';

/**
 * Pruebas de aceptación (propuesta §7) recorriendo la interfaz como lo haría el usuario.
 */
describe('Criterios de aceptación', () => {
  it('1. Si el contrato no incluye repuestos, el sistema lo advierte antes de aprobar', async () => {
    const { user } = renderApp('/casos', 'gestor');
    await user.click(await screen.findByRole('link', { name: 'CASO-2026-0012' }));
    await user.click(await screen.findByRole('button', { name: 'Aprobar' }));
    const dialogo = await screen.findByRole('dialog');
    expect(await within(dialogo).findByText(/no incluye repuestos/)).toBeInTheDocument();
    const aprobar = within(dialogo).getByRole('button', { name: 'Aprobar caso' });
    expect(aprobar).toBeDisabled();
    await user.click(within(dialogo).getByLabelText(/Entiendo las advertencias/));
    await user.click(aprobar);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Aprobado con advertencias')).toBeInTheDocument();
  });

  it('2. Al cerrar un caso, el servicio y los repuestos aparecen en la hoja de vida', async () => {
    const { user } = renderApp('/tecnico', 'tecnico');
    await user.click(await screen.findByText('CASO-2026-0007'));
    await user.click(await screen.findByRole('button', { name: 'Registrar trabajo y cerrar' }));
    const dialogo = await screen.findByRole('dialog');
    await user.type(
      within(dialogo).getByLabelText('Trabajo realizado'),
      'Se reemplazó la cuchilla de limpieza.',
    );
    await user.selectOptions(await within(dialogo).findByLabelText('Agregar ítem'), 'it-7');
    await user.click(within(dialogo).getByRole('button', { name: 'Cerrar caso' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Trabajo realizado')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /CNCJ71235/ }));
    const historial = await screen.findByText('Historial de servicios y repuestos');
    const card = historial.closest('section')!;
    expect(
      await within(card).findByText('Se reemplazó la cuchilla de limpieza.'),
    ).toBeInTheDocument();
    expect(within(card).getByText(/1 × Cuchilla de limpieza de tambor/)).toBeInTheDocument();
  });

  it('3. Cuando una existencia baja del mínimo, se genera una alerta', async () => {
    const { user } = renderApp('/inventario', 'gestor');
    await user.click(await screen.findByRole('button', { name: /Registrar movimiento/ }));
    const dialogo = await screen.findByRole('dialog');
    await user.selectOptions(within(dialogo).getByLabelText('Ítem'), 'it-4');
    await user.selectOptions(within(dialogo).getByLabelText('Tipo de movimiento'), 'salida');
    await user.type(within(dialogo).getByLabelText('Cantidad'), '2');
    await user.click(within(dialogo).getByRole('button', { name: 'Registrar movimiento' }));
    expect(await screen.findByText(/Tambor OD-3018 \(1 de mínimo 2\)/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Alertas/ }));
    expect(await screen.findByText('Tambor OD-3018 por debajo del mínimo')).toBeInTheDocument();
  });

  it('4. El informe de casos muestra el estado de cada caso y cuáles están demorados', async () => {
    renderApp('/informes?tab=casos', 'gerente');
    const tabla = await screen.findByRole('table', { name: 'Informe de casos' });
    const filas = within(tabla).getAllByRole('row').slice(1);
    expect(filas.length).toBe(13);
    expect(within(tabla).getAllByText('Demorado').length).toBeGreaterThan(0);
    expect(within(tabla).getAllByText('Cerrado').length).toBe(6);
  });
});
