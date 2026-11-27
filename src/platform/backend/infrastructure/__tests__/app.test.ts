import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.ts';
import { loadConfig } from '../config.ts';
import { createTestApp, createTestDatabase, postJson } from './helpers.ts';

const root = path.resolve(import.meta.dirname, '../../../../..');
const assetsDir = path.join(root, 'assets');

describe('app', () => {
  describe('in development', () => {
    const app = createApp({
      config: loadConfig({}),
      storage: createTestDatabase(),
      modules: [],
      webDir: path.join(root, 'dist/web'),
      assetsDir,
    });

    it('should answer the health check with security headers', async () => {
      // When
      const response = await request(app).get('/api/health');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should not force HTTPS when HTTPS is off', async () => {
      // When
      const response = await request(app).get('/api/health');

      // Then
      expect(response.headers['content-security-policy']).not.toContain(
        'upgrade-insecure-requests',
      );

      expect(response.headers['strict-transport-security']).toBeUndefined();
    });

    it('should force HTTPS when HTTPS is on', async () => {
      // Given
      const secureApp = createApp({
        config: loadConfig({ COOKIE_SECURE: 'true' }),
        storage: createTestDatabase(),
        modules: [],
        webDir: path.join(root, 'dist/web'),
        assetsDir,
      });

      // When
      const response = await request(secureApp).get('/api/health');

      // Then
      expect(response.headers['content-security-policy']).toContain('upgrade-insecure-requests');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    it('should return a JSON 404 when the API route is unknown', async () => {
      // When
      const response = await request(app).get('/api/nope');

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });

    it('should serve art from the assets folder at /media', async () => {
      // When
      const response = await request(app).get('/media/scene/day/background.webp');

      // Then
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/webp');
    });
  });

  describe('in production', () => {
    let webDir: string;

    beforeAll(() => {
      webDir = fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-web-'));
      fs.writeFileSync(path.join(webDir, 'index.html'), '<title>fake app</title>');
      fs.mkdirSync(path.join(webDir, 'assets'));
      fs.writeFileSync(path.join(webDir, 'assets', 'app-abc123.js'), "console.log('fake');");
    });

    afterAll(() => {
      fs.rmSync(webDir, { recursive: true, force: true });
    });

    const productionApp = () =>
      createApp({
        config: loadConfig({ NODE_ENV: 'production' }),
        storage: createTestDatabase(),
        modules: [],
        webDir,
        assetsDir,
      });

    it('should return a JSON 404 when the API route is unknown, not the app page', async () => {
      // Given
      const production = productionApp();

      // When
      const response = await request(production).get('/api/nope');

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });

    it('should serve the app page when a non-API route is unknown', async () => {
      // Given
      const production = productionApp();

      // When
      const response = await request(production).get('/some/deep/link');

      // Then
      expect(response.text).toContain('fake app');
    });

    it('should let browsers keep a hashed asset for a year', async () => {
      // Given
      const production = productionApp();

      // When
      const response = await request(production).get('/assets/app-abc123.js');

      // Then
      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    });

    it('should answer 404 for a hashed asset that does not exist', async () => {
      // Given
      const production = productionApp();

      // When
      const response = await request(production).get('/assets/gone-000000.js');

      // Then
      expect(response.status).toBe(404);
      expect(response.text).not.toContain('fake app');
    });

    it('should not tell browsers to keep index.html', async () => {
      // Given
      const production = productionApp();

      // When
      const response = await request(production).get('/');

      // Then
      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).not.toContain('immutable');
    });

    describe('when the app folder sits under a dot folder', () => {
      let tempDir: string;
      let dottedWebDir: string;

      beforeAll(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-dotted-'));
        dottedWebDir = path.join(tempDir, '.worktrees', 'web');
        fs.mkdirSync(dottedWebDir, { recursive: true });
        fs.writeFileSync(path.join(dottedWebDir, 'index.html'), '<title>fake app</title>');
        fs.writeFileSync(path.join(dottedWebDir, '.env'), 'FAKE_SECRET=fake');
      });

      afterAll(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
      });

      const dottedApp = () =>
        createApp({
          config: loadConfig({ NODE_ENV: 'production' }),
          storage: createTestDatabase(),
          modules: [],
          webDir: dottedWebDir,
          assetsDir,
        });

      it('should serve the app page for a deep link', async () => {
        // Given
        const production = dottedApp();

        // When
        const response = await request(production).get('/some/deep/link');

        // Then
        expect(response.status).toBe(200);
        expect(response.text).toContain('fake app');
      });

      it('should serve the app page instead of a dotfile', async () => {
        // Given
        const production = dottedApp();

        // When
        const response = await request(production).get('/.env');

        // Then
        expect(response.text).toContain('fake app');
        expect(response.text).not.toContain('FAKE_SECRET');
      });
    });
  });

  describe('native TypeScript execution', () => {
    it('should run the real entry point with plain node', async () => {
      // Given
      const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-data-'));

      const child = spawn('node', ['src/platform/backend/infrastructure/main.ts'], {
        cwd: root,
        env: {
          ...process.env,
          PORT: '3917',
          HOST: '127.0.0.1',
          NODE_ENV: 'test',
          DATA_DIR: dataDir,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      try {
        await new Promise<void>((resolve, reject) => {
          child.once('error', reject);

          child.once('exit', (code) => {
            reject(new Error(`server exited early with code ${String(code)}`));
          });

          child.stdout.on('data', (chunk: Buffer) => {
            if (chunk.toString().includes('listening')) {
              resolve();
            }
          });
        });

        // When
        const response = await fetch('http://127.0.0.1:3917/api/health');

        // Then
        expect(await response.json()).toEqual({ status: 'ok' });
      } finally {
        child.kill();
        fs.rmSync(dataDir, { recursive: true, force: true });
      }
    });
  });

  describe('trusted proxies', () => {
    const LOGIN_LIMIT = { windowMs: 60_000, maxFailedAttempts: 1 };

    afterEach(() => {
      vi.restoreAllMocks();
    });

    const failedLoginFrom = (app: ReturnType<typeof createTestApp>['app'], address: string) =>
      postJson(app, '/api/auth/login', { username: 'nobody', password: 'wrong-password' }).set(
        'X-Forwarded-For',
        address,
      );

    it('should count failed logins per forwarded address when one proxy is trusted', async () => {
      // Given
      const { app } = createTestApp({ TRUST_PROXY: '1' }, { loginLimit: LOGIN_LIMIT });

      // When
      const first = await failedLoginFrom(app, '203.0.113.7');
      const second = await failedLoginFrom(app, '203.0.113.7');
      const otherClient = await failedLoginFrom(app, '203.0.113.8');

      // Then
      expect(first.status).toBe(401);
      expect(second.status).toBe(429);
      expect(otherClient.status).toBe(401);
    });

    it('should ignore the forwarded address when no proxy is trusted', async () => {
      // Given
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { app } = createTestApp({}, { loginLimit: LOGIN_LIMIT });

      // When
      const first = await failedLoginFrom(app, '203.0.113.7');
      const second = await failedLoginFrom(app, '203.0.113.8');

      // Then
      expect(first.status).toBe(401);
      expect(second.status).toBe(429);
    });
  });

  describe('import aliases', () => {
    it('should resolve #platform/backend through package.json imports', async () => {
      // When / Then
      await expect(import('#platform/backend')).resolves.toBeDefined();
    });
  });
});
