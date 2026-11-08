import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { resetDb } from '@/mocks/db';
import { setClock } from '@/mocks/handlers';
import { server, TEST_NOW } from '@/mocks/server';

beforeAll(() => {
  setClock(() => TEST_NOW);
  server.listen({ onUnhandledFrame: 'error' });
});
beforeEach(() => {
  localStorage.clear();
  resetDb();
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
