import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTestApp,
  createTestUser,
  sessionCookieFor,
} from '../../infrastructure/__tests__/helpers.ts';
import type { TestApp } from '../../infrastructure/__tests__/helpers.ts';
import { loadModules } from '../../infrastructure/modules/loadModules.ts';
import { migrateModules } from '../../infrastructure/modules/migrateModules.ts';

const fixtures = (name: string): string =>
  path.join(import.meta.dirname, '../../infrastructure/modules/__tests__/fixtures', name);

describe('modules API', () => {
  let ctx: TestApp;
  let ash: string;

  beforeEach(async () => {
    const modules = await loadModules(fixtures('valid'));
    ctx = createTestApp({}, { modules });
    migrateModules(ctx.db, modules);
    await createTestUser(ctx.db, 'Ash');
    ash = await sessionCookieFor(ctx.app, 'Ash');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('without a session', () => {
    it.each(['/api/modules', '/api/m/notes'])('should answer 401 to GET %s', async (url) => {
      // When
      const response = await request(ctx.app).get(url);

      // Then
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Not authenticated' });
    });
  });

  describe('GET /api/modules', () => {
    it('should list the enabled modules', async () => {
      // When
      const response = await request(ctx.app).get('/api/modules').set('Cookie', ash);

      // Then
      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        modules: [
          {
            id: 'clock',
            icon: 'calendar',
            route: '/m/clock',
          },
          {
            id: 'notes',
            icon: 'notes',
            route: '/m/notes',
          },
        ],
      });
    });
  });

  describe('module endpoints', () => {
    it('should give a module its storage and the current user', async () => {
      // Given
      ctx.db.prepare("INSERT INTO notes_items (text) VALUES ('Buy milk')").run();

      // When
      const response = await request(ctx.app).get('/api/m/notes').set('Cookie', ash);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: 'Ash', count: 1 });
    });

    it("should give a module today's date in the household time zone", async () => {
      // Given
      const modules = await loadModules(fixtures('valid'));
      const warsaw = createTestApp({ TZ: 'Europe/Warsaw' }, { modules });
      migrateModules(warsaw.db, modules);
      warsaw.clock.now = Date.parse('2026-03-31T22:30:00Z');
      await createTestUser(warsaw.db, 'Ash');
      const cookie = await sessionCookieFor(warsaw.app, 'Ash');

      // When
      const response = await request(warsaw.app).get('/api/m/notes/today').set('Cookie', cookie);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ today: '2026-04-01' });
    });

    it("should prefix a module's log lines with its id", async () => {
      // Given
      const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      // When
      await request(ctx.app).get('/api/m/notes').set('Cookie', ash);

      // Then
      expect(log).toHaveBeenCalledWith('[notes] listed');
    });

    it.each(['/api/m/paused', '/api/m/clock', '/api/m/unknown'])(
      'should answer 404 to GET %s',
      async (url) => {
        // When
        const response = await request(ctx.app).get(url).set('Cookie', ash);

        // Then
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Not found' });
      },
    );
  });

  describe('request bodies', () => {
    let bodies: TestApp;
    let misty: string;

    const postText = (url: string, length: number, cookie?: string) => {
      const post = request(bodies.app)
        .post(url)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ text: 'x'.repeat(length) }));

      return cookie === undefined ? post : post.set('Cookie', cookie);
    };

    beforeEach(async () => {
      bodies = createTestApp({}, { modules: await loadModules(fixtures('bodies')) });
      await createTestUser(bodies.db, 'Misty');
      misty = await sessionCookieFor(bodies.app, 'Misty');
    });

    it("should accept a body up to the module's limit", async () => {
      // When
      const response = await postText('/api/m/photos', 300_000, misty);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: 300_011 });
    });

    it("should answer 413 when a body exceeds the module's limit", async () => {
      // When
      const response = await postText('/api/m/photos', 1_100_000, misty);

      // Then
      expect(response.status).toBe(413);
      expect(response.body).toEqual({ error: 'Invalid request body' });
    });

    it('should keep the default limit for platform routes', async () => {
      // When
      const response = await postText('/api/auth/login', 300_000);

      // Then
      expect(response.status).toBe(413);
      expect(response.body).toEqual({ error: 'Invalid request body' });
    });

    it('should keep the default limit for a module without one', async () => {
      // When
      const response = await postText('/api/m/plain', 300_000, misty);

      // Then
      expect(response.status).toBe(413);
      expect(response.body).toEqual({ error: 'Invalid request body' });
    });
  });

  describe('startup', () => {
    it('should fail when a module cannot register', async () => {
      // Given
      const modules = await loadModules(fixtures('failing-register'));

      // When / Then
      expect(() => createTestApp({}, { modules })).toThrow('Cannot register notes');
    });
  });
});
