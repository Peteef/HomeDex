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
            name: 'Clock',
            description: null,
            icon: 'calendar',
            route: '/m/clock',
          },
          {
            id: 'notes',
            name: 'Notes',
            description: 'Short notes',
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

  describe('startup', () => {
    it('should fail when a module cannot register', async () => {
      // Given
      const modules = await loadModules(fixtures('failing-register'));

      // When / Then
      expect(() => createTestApp({}, { modules })).toThrow('Cannot register notes');
    });
  });
});
