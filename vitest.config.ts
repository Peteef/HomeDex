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
            'platform/backend/**/*.test.ts',
            'modules/*/backend/**/*.test.ts',
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
            'platform/frontend/**/*.test.{ts,tsx}',
            'modules/*/frontend/**/*.test.{ts,tsx}',
          ],
          setupFiles: ['./platform/frontend/test-setup.ts'],
        },
      },
    ],
  },
});
