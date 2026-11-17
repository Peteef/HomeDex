import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const TEST_APP_VERSION = '0.0.0-test';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'scripts/**/*.ts'],
      exclude: [
        '**/__tests__/**',
        '**/*.d.ts',
        '**/locales/**',
        'src/platform/frontend/test-setup.ts',
      ],
      reporter: ['text-summary', 'html'],
    },
    projects: [
      {
        test: {
          name: 'server',
          environment: 'node',
          include: [
            'src/platform/backend/**/__tests__/**/*.test.ts',
            'src/platform/shared/**/__tests__/**/*.test.ts',
            'src/modules/*/backend/**/__tests__/**/*.test.ts',
            'scripts/**/__tests__/**/*.test.ts',
            'tests/**/*.test.ts',
          ],
          testTimeout: 30_000,
        },
      },
      {
        plugins: [react()],
        define: { __APP_VERSION__: JSON.stringify(TEST_APP_VERSION) },
        test: {
          name: 'web',
          environment: 'jsdom',
          include: [
            'src/platform/frontend/**/__tests__/**/*.test.{ts,tsx}',
            'src/modules/*/frontend/**/__tests__/**/*.test.{ts,tsx}',
          ],
          setupFiles: ['./src/platform/frontend/test-setup.ts'],
        },
      },
    ],
  },
});
