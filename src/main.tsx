import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './index.css';

async function iniciarMocks() {
  // Sin backend real, el backend simulado (MSW) atiende la API REST en el navegador.
  if (import.meta.env.VITE_USE_MOCKS === 'false') return;
  const { worker } = await import('./mocks/browser');
  const base = import.meta.env.BASE_URL;
  await worker.start({
    onUnhandledFrame: 'bypass',
    quiet: true,
    // En GitHub Pages la app vive en una subcarpeta: el service worker se sirve desde ahí.
    serviceWorker: { url: `${base}mockServiceWorker.js`, options: { scope: base } },
  });
}

iniciarMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
