import path from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { moduleTestApp, moduleTestStorage } from './testing.ts';

const fixtures = path.resolve(
  import.meta.dirname,
  '../../infrastructure/modules/__tests__/fixtures/valid',
);

const NOTES = path.join(fixtures, 'notes');

describe('module test kit', () => {
  describe('moduleTestStorage', () => {
    it("should create the module's tables", () => {
      // When
      const storage = moduleTestStorage(NOTES);

      // Then
      expect(storage.prepare('SELECT COUNT(*) AS count FROM notes_items').get()).toEqual({
        count: 0,
      });
    });
  });

  describe('moduleTestApp', () => {
    it("should serve the module's routes to a signed-in user", async () => {
      // Given
      const { app, storage, signIn } = await moduleTestApp(NOTES);
      storage.prepare("INSERT INTO notes_items (text) VALUES ('Milk')").run();
      const cookie = await signIn('Misty');

      // When
      const response = await request(app).get('/api/m/notes').set('Cookie', cookie);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: 'Misty', count: 1 });
    });

    it('should sign the same user in again', async () => {
      // Given
      const { app, signIn } = await moduleTestApp(NOTES);
      await signIn('Misty');

      // When
      const cookie = await signIn('Misty');

      // Then
      expect((await request(app).get('/api/m/notes').set('Cookie', cookie)).status).toBe(200);
    });

    it("should keep the module's routes behind the login", async () => {
      // Given
      const { app } = await moduleTestApp(NOTES);

      // When
      const response = await request(app).get('/api/m/notes');

      // Then
      expect(response.status).toBe(401);
    });

    it('should refuse a disabled module', async () => {
      // When / Then
      await expect(moduleTestApp(path.join(fixtures, 'paused'))).rejects.toThrow('disabled');
    });
  });
});
