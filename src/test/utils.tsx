import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createQueryClient, Providers } from '@/app/Providers';
import { routes } from '@/app/router';
import { tokenStorage } from '@/shared/api/http';

/** Usuarios de la semilla de demostración. */
export const USR = {
  gerente: 'usr-1',
  gestor: 'usr-2',
  tecnico: 'usr-3',
  cliente: 'usr-6',
  cliente2: 'usr-7',
} as const;

/** Renderiza la aplicación completa en una ruta, opcionalmente con sesión iniciada. */
export function renderApp(path: string, como?: keyof typeof USR) {
  if (como) tokenStorage.set(`mock-token-${USR[como]}`);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { retry: false, staleTime: 0 } });
  const user = userEvent.setup();
  const utils = render(
    <Providers client={client}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...utils, user, router };
}
