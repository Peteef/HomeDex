import type { Server } from 'node:http';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createTestApp,
  createTestUser,
  TEST_PASSWORD,
} from '../../src/platform/backend/infrastructure/__tests__/helpers.ts';

const ROOT = path.resolve(import.meta.dirname, '../..');
const USERNAME = 'Misty';

const portOf = (server: Server | null | undefined): number => {
  const address = server?.address();
  if (!address || typeof address === 'string') {
    throw new Error('Server is not listening');
  }
  return address.port;
};

// Runs the real Vite dev server with the project's config in front of a test backend, the way
// `npm run dev` does, so a proxy setting that breaks the backend's Origin check is caught.
describe('dev proxy', () => {
  let backend: Server;
  let vite: ViteDevServer;
  let viteUrl: string;

  beforeAll(async () => {
    const { app, db } = createTestApp();
    await createTestUser(db, USERNAME);
    backend = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => backend.once('listening', resolve));
    process.env.PORT = String(portOf(backend));
    vite = await createServer({
      root: ROOT,
      configFile: path.join(ROOT, 'vite.config.ts'),
      logLevel: 'silent',
      server: { port: 0, host: '127.0.0.1', ws: false },
    });
    await vite.listen();
    viteUrl = `http://127.0.0.1:${String(portOf(vite.httpServer as Server))}`;
  });

  afterAll(async () => {
    await vite.close();
    await new Promise((resolve) => backend.close(resolve));
    delete process.env.PORT;
  });

  const login = (origin: string) =>
    fetch(`${viteUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({ username: USERNAME, password: TEST_PASSWORD }),
    });

  it('should let the browser log in through the proxy when the page comes from the dev server', async () => {
    // When
    const response = await login(viteUrl);

    // Then
    expect(response.status).toBe(200);
  });

  it('should still refuse a write when the browser sends a foreign origin', async () => {
    // When
    const response = await login('https://evil.example');

    // Then
    expect(response.status).toBe(403);
  });
});
