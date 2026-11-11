import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTestApp,
  createTestUser,
  sessionCookieFor,
} from '../../infrastructure/__tests__/helpers.ts';
import type { TestApp } from '../../infrastructure/__tests__/helpers.ts';

type WriteMethod = 'post' | 'patch' | 'put' | 'delete';

const inEnglish = (title: string) => ({ en: { title } });

const BUDGET = {
  texts: inEnglish('Budget'),
  url: 'https://docs.example.com/budget',
  icon: 'wallet',
  scope: 'shared',
};

describe('tiles API', () => {
  let ctx: TestApp;
  let ash: string;
  let misty: string;

  const get = (cookie: string): request.Test =>
    request(ctx.app).get('/api/tiles').set('Cookie', cookie);

  const write = (method: WriteMethod, url: string, cookie: string, body?: unknown): request.Test =>
    request(ctx.app)
      [method](url)
      .set('Cookie', cookie)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(body ?? {}));

  const createTile = async (cookie: string, body: object = BUDGET): Promise<number> =>
    ((await write('post', '/api/tiles', cookie, body)).body as { tile: { id: number } }).tile.id;

  const titlesFor = async (cookie: string): Promise<string[]> =>
    ((await get(cookie)).body as { tiles: { texts: { en: { title: string } } }[] }).tiles.map(
      ({ texts }) => texts.en.title,
    );

  beforeEach(async () => {
    ctx = createTestApp();
    await createTestUser(ctx.db, 'Ash');
    await createTestUser(ctx.db, 'Misty');
    ash = await sessionCookieFor(ctx.app, 'Ash');
    misty = await sessionCookieFor(ctx.app, 'Misty');
  });

  describe('without a session', () => {
    it.each([
      ['get', '/api/tiles'],
      ['post', '/api/tiles'],
      ['patch', '/api/tiles/1'],
      ['delete', '/api/tiles/1'],
      ['put', '/api/tiles/1/pin'],
      ['delete', '/api/tiles/1/pin'],
    ] as const)('should answer 401 to %s %s', async (method, url) => {
      // When
      const response = await request(ctx.app)
        [method](url)
        .set('Content-Type', 'application/json')
        .send('{}');

      // Then
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/tiles', () => {
    it('should list the visible tiles with the pinned flag', async () => {
      // Given
      const id = await createTile(ash);
      await write('put', `/api/tiles/${String(id)}/pin`, ash);

      // When
      const response = await get(ash);

      // Then
      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        tiles: [
          {
            id,
            dexNo: 1,
            kind: 'link',
            texts: { en: { title: 'Budget', description: null } },
            icon: 'wallet',
            url: 'https://docs.example.com/budget',
            moduleId: null,
            scope: 'shared',
            pinned: true,
            editable: true,
          },
        ],
      });
    });
  });

  describe('POST /api/tiles', () => {
    it('should create the tile with its text per language and answer 201', async () => {
      // When
      const response = await write('post', '/api/tiles', ash, {
        ...BUDGET,
        texts: {
          en: { title: 'Budget', description: 'Monthly costs' },
          pl: { title: 'Budżet' },
        },
      });

      // Then
      expect(response.status).toBe(201);

      expect(response.body).toEqual({
        tile: expect.objectContaining({
          texts: {
            en: { title: 'Budget', description: 'Monthly costs' },
            pl: { title: 'Budżet', description: null },
          },
          editable: true,
        }) as unknown,
      });
    });

    it('should answer 400 when fields are missing', async () => {
      // When
      const response = await write('post', '/api/tiles', ash, { texts: inEnglish('Budget') });

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid tile' });
    });

    it('should answer 400 with the reason when the URL is not a web address', async () => {
      // When
      const response = await write('post', '/api/tiles', ash, {
        ...BUDGET,
        url: 'javascript:alert(1)',
      });

      // Then
      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        error: 'URL must be a web address starting with http:// or https://',
      });
    });

    it('should answer 400 with the reason when no language has a title', async () => {
      // When
      const response = await write('post', '/api/tiles', ash, { ...BUDGET, texts: {} });

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'A title in at least one language is required' });
    });
  });

  describe('PATCH /api/tiles/:id', () => {
    it('should change the own tile', async () => {
      // Given
      const id = await createTile(ash);

      // When
      const response = await write('patch', `/api/tiles/${String(id)}`, ash, {
        texts: { pl: { title: 'Finanse', description: null } },
      });

      // Then
      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        tile: expect.objectContaining({
          id,
          texts: { pl: { title: 'Finanse', description: null } },
        }) as unknown,
      });
    });

    it('should answer 400 when the own shared tile is made personal', async () => {
      // Given
      const id = await createTile(ash);

      // When
      const response = await write('patch', `/api/tiles/${String(id)}`, ash, {
        scope: 'personal',
      });

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'A shared tile cannot be made personal' });
      expect(await titlesFor(misty)).toEqual(['Budget']);
    });

    it('should answer 400 when a field has the wrong type', async () => {
      // Given
      const id = await createTile(ash);

      // When
      const response = await write('patch', `/api/tiles/${String(id)}`, ash, { scope: 'public' });

      // Then
      expect(response.status).toBe(400);
    });

    it.each(['abc', '0', '-1', '1.5'])('should answer 404 when the id is %j', async (id) => {
      // When
      const response = await write('patch', `/api/tiles/${id}`, ash, { texts: inEnglish('Ghost') });

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Tile not found' });
    });
  });

  describe('DELETE /api/tiles/:id', () => {
    it('should delete the own tile and answer 204', async () => {
      // Given
      const id = await createTile(ash);

      // When
      const response = await write('delete', `/api/tiles/${String(id)}`, ash);

      // Then
      expect(response.status).toBe(204);
      expect(await titlesFor(ash)).toEqual([]);
    });
  });

  describe('PUT and DELETE /api/tiles/:id/pin', () => {
    it('should pin and unpin the tile for the user only', async () => {
      // Given
      const id = await createTile(ash);
      const pin = `/api/tiles/${String(id)}/pin`;
      await write('put', pin, misty);

      // When
      const pinned = await write('put', pin, ash);
      const unpinned = await write('delete', pin, misty);

      // Then
      expect([pinned.status, unpinned.status]).toEqual([204, 204]);
      expect((await get(ash)).body).toMatchObject({ tiles: [{ pinned: true }] });
      expect((await get(misty)).body).toMatchObject({ tiles: [{ pinned: false }] });
    });
  });

  describe('isolation between two users', () => {
    let personal: string;
    let shared: string;

    beforeEach(async () => {
      personal = `/api/tiles/${String(await createTile(ash, { ...BUDGET, texts: inEnglish('Diary'), scope: 'personal' }))}`;
      shared = `/api/tiles/${String(await createTile(ash))}`;
    });

    it('should never show the personal tile of another user', async () => {
      // When / Then
      expect(await titlesFor(misty)).toEqual(['Budget']);
      expect(await titlesFor(ash)).toEqual(['Diary', 'Budget']);
    });

    it.each([
      ['patch', ''],
      ['delete', ''],
      ['put', '/pin'],
      ['delete', '/pin'],
    ] as const)(
      'should answer 404 to %s on the personal tile of another user',
      async (method, suffix) => {
        // When
        const response = await write(method, `${personal}${suffix}`, misty, {
          texts: inEnglish('Mine now'),
        });

        // Then
        expect(response.status).toBe(404);
        expect(await titlesFor(ash)).toEqual(['Diary', 'Budget']);
      },
    );

    it.each(['patch', 'delete'] as const)(
      'should answer 403 to %s on the shared tile of another user',
      async (method) => {
        // When
        const response = await write(method, shared, misty, { texts: inEnglish('Mine now') });

        // Then
        expect(response.status).toBe(403);
        expect(response.body).toEqual({ error: 'Only the creator can change this tile' });
        expect(await titlesFor(ash)).toEqual(['Diary', 'Budget']);
      },
    );

    it('should show the shared tile of another user as not editable', async () => {
      // When
      const response = await get(misty);

      // Then
      expect(response.body).toMatchObject({
        tiles: [{ texts: { en: { title: 'Budget' } }, editable: false }],
      });
    });
  });
});
