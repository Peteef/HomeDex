import { spawn } from 'node:child_process';
import path from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';
import { loadConfig } from '../config.ts';

const root = path.resolve(import.meta.dirname, '../../../..');
const assetsDir = path.join(root, 'assets');

describe('app', () => {
  const app = createApp({ config: loadConfig({}), webDir: path.join(root, 'dist/web'), assetsDir });

  it('should answer the health check with security headers', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should not force HTTPS when HTTPS is off', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers['content-security-policy']).not.toContain('upgrade-insecure-requests');
    expect(response.headers['strict-transport-security']).toBeUndefined();
  });

  it('should force HTTPS when HTTPS is on', async () => {
    const secureApp = createApp({
      config: loadConfig({ COOKIE_SECURE: 'true' }),
      webDir: path.join(root, 'dist/web'),
      assetsDir,
    });
    const response = await request(secureApp).get('/api/health');
    expect(response.headers['content-security-policy']).toContain('upgrade-insecure-requests');
    expect(response.headers['strict-transport-security']).toBeDefined();
  });

  it('should return a JSON 404 when the API route is unknown', async () => {
    const response = await request(app).get('/api/nope');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });

  it('should serve art from the assets folder at /media', async () => {
    const response = await request(app).get('/media/scene/background.svg');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('svg');
  });
});

describe('native TypeScript execution', () => {
  it('should run the real entry point with plain node', async () => {
    const child = spawn('node', ['src/platform/backend/main.ts'], {
      cwd: root,
      env: { ...process.env, PORT: '3917', HOST: '127.0.0.1', NODE_ENV: 'test' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    try {
      await new Promise<void>((resolve, reject) => {
        child.once('error', reject);
        child.once('exit', (code) => {
          reject(new Error(`server exited early with code ${String(code)}`));
        });
        child.stdout.on('data', (chunk: Buffer) => {
          if (chunk.toString().includes('listening')) resolve();
        });
      });
      const response = await fetch('http://127.0.0.1:3917/api/health');
      expect(await response.json()).toEqual({ status: 'ok' });
    } finally {
      child.kill();
    }
  });
});

describe('import aliases', () => {
  it('should resolve #platform/backend through package.json imports', async () => {
    const api = await import('#platform/backend');
    expect(typeof api).toBe('object');
  });
});
