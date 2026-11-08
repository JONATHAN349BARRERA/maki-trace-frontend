import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/http';
import { AuthProvider } from '@/modules/auth/AuthContext';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // No reintentar errores del cliente (401/403/404): no se arreglan solos.
        retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 2,
      },
    },
  });
}

export function Providers({ client, children }: { client: QueryClient; children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
