import { setupServer } from 'msw/node';
import { configureSeed } from './db';
import { handlers } from './handlers';
import { crearSeed } from './seed';

/** Fecha fija para que las pruebas sean deterministas. */
export const TEST_NOW = new Date('2026-11-08T15:00:00.000Z');

configureSeed(() => crearSeed(TEST_NOW));
export const server = setupServer(...handlers);
