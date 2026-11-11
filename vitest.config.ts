import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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
