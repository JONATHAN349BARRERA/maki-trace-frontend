import { setupWorker } from 'msw/browser';
import { configureSeed } from './db';
import { handlers } from './handlers';
import { crearSeed } from './seed';

configureSeed(() => crearSeed());
export const worker = setupWorker(...handlers);
