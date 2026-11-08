/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/test/**',
        'src/mocks/browser.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/types.ts',
        'src/vite-env.d.ts',
      ],
      // Definición de terminado (propuesta §9.1): cobertura mínima del 75 %.
      thresholds: { statements: 75, branches: 75, functions: 75, lines: 75 },
    },
  },
});
