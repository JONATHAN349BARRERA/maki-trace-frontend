import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { createQueryClient, Providers } from './Providers';
import { createRouter } from './router';

export function App() {
  const [client] = useState(createQueryClient);
  const [router] = useState(createRouter);
  return (
    <Providers client={client}>
      <RouterProvider router={router} />
    </Providers>
  );
}
