import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';
import { loadConfig } from '../config.ts';
import { createTestDatabase } from './helpers.ts';

const root = path.resolve(import.meta.dirname, '../../../../..');
const assetsDir = path.join(root, 'assets');

describe('app', () => {
  describe('in development', () => {
    const app = createApp({
      config: loadConfig({}),
      storage: createTestDatabase(),
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
      const response = await request(app).get('/media/scene/background.svg');

      // Then
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('svg');
    });
  });

  describe('in production', () => {
    let webDir: string;

    beforeAll(() => {
      webDir = fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-web-'));
      fs.writeFileSync(path.join(webDir, 'index.html'), '<title>fake app</title>');
    });

    afterAll(() => {
      fs.rmSync(webDir, { recursive: true, force: true });
    });

    const productionApp = () =>
      createApp({
        config: loadConfig({ NODE_ENV: 'production' }),
        storage: createTestDatabase(),
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

  describe('import aliases', () => {
    it('should resolve #platform/backend through package.json imports', async () => {
      // When
      const api = await import('#platform/backend');

      // Then
      expect(typeof api.currentUser).toBe('function');
    });
  });
});
