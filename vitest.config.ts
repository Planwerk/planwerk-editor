import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '__mocks__/',
        'test-utils/',
        '*.config.ts',
        '*.config.js',
        '.next/',
        'tailwind.config.ts',
        'postcss.config.mjs',
        'next.config.ts',
        'server.ts', // Excluded as it's the entry point, not testable in isolation
      ],
      // Global thresholds temporarily disabled until Phase 3 & 4 are complete
      // thresholds: {
      //   lines: 70,
      //   functions: 70,
      //   branches: 70,
      //   statements: 70,
      // },

      // Per-file thresholds for implemented modules (Phase 1 & 2)
      thresholds: {
        'lib/toc.ts': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
        'lib/docs.ts': {
          lines: 75,
          functions: 75,
          branches: 75,
          statements: 75,
        },
        'app/api/docs/route.ts': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
      },
      // Per-file thresholds for critical security code
      // perFile: true, // Not supported in current version
    },
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/', '.next/'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
