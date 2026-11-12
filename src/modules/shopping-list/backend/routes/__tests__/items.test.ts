import path from 'node:path';
import { moduleTestApp } from '#platform/backend/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const MODULE_DIR = path.resolve(import.meta.dirname, '../../..');
const ITEMS = '/api/m/shopping-list/items';

const signedInApp = async () => {
  const { app, signIn } = await moduleTestApp(MODULE_DIR);
  const misty = await signIn('Misty');
  const brock = await signIn('Brock');

  const send = (method: 'post' | 'put' | 'delete', url: string, cookie: string, body?: unknown) =>
    request(app)
      [method](url)
      .set('Cookie', cookie)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(body ?? {}));

  const list = async (cookie = misty) =>
    (await request(app).get(ITEMS).set('Cookie', cookie)).body as {
      items: { text: string; checked: boolean }[];
    };

  const add = async (text: string, cookie = misty) =>
    (await send('post', ITEMS, cookie, { text })).body as { item: { id: number } };

  return {
    app,
    misty,
    brock,
    send,
    list,
    add,
  };
};

describe('shopping list items routes', () => {
  it('should add an item and list it for every user', async () => {
    // Given
    const { send, list, misty, brock } = await signedInApp();

    // When
    const response = await send('post', ITEMS, misty, { text: 'Milk', amount: '2 l' });

    // Then
    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      item: {
        id: 1,
        text: 'Milk',
        amount: '2 l',
        addedBy: 'Misty',
        checked: false,
      },
    });

    expect(await list(brock)).toEqual({ items: [(response.body as { item: unknown }).item] });
  });

  it.each([
    ['a missing text', { amount: '2' }],
    ['a text that is not a string', { text: 3 }],
    ['an empty text', { text: ' ' }],
  ])('should reject %s with 400', async (_case, body) => {
    // Given
    const { send, misty } = await signedInApp();

    // When
    const response = await send('post', ITEMS, misty, body);

    // Then
    expect(response.status).toBe(400);
  });

  it('should check and uncheck an item for everyone', async () => {
    // Given
    const { send, list, add, misty, brock } = await signedInApp();
    const { item } = await add('Milk');

    // When
    const checked = await send('put', `${ITEMS}/${String(item.id)}/check`, brock);

    // Then
    expect(checked.status).toBe(204);
    expect((await list(misty)).items).toMatchObject([{ text: 'Milk', checked: true }]);

    // When
    const unchecked = await send('delete', `${ITEMS}/${String(item.id)}/check`, misty);

    // Then
    expect(unchecked.status).toBe(204);
    expect((await list(brock)).items).toMatchObject([{ text: 'Milk', checked: false }]);
  });

  it.each(['42', 'abc'])('should answer 404 when checking the item %s', async (id) => {
    // Given
    const { send, misty } = await signedInApp();

    // When
    const response = await send('put', `${ITEMS}/${id}/check`, misty);

    // Then
    expect(response.status).toBe(404);
  });

  it('should delete an item', async () => {
    // Given
    const { send, list, add, misty } = await signedInApp();
    const { item } = await add('Milk');
    await add('Bread');

    // When
    const response = await send('delete', `${ITEMS}/${String(item.id)}`, misty);

    // Then
    expect(response.status).toBe(204);
    expect((await list()).items).toMatchObject([{ text: 'Bread' }]);
  });

  it('should clear only the checked items', async () => {
    // Given
    const { send, list, add, misty } = await signedInApp();
    const { item } = await add('Milk');
    await add('Bread');
    await send('put', `${ITEMS}/${String(item.id)}/check`, misty);

    // When
    const response = await send('delete', '/api/m/shopping-list/checked-items', misty);

    // Then
    expect(response.status).toBe(204);
    expect((await list()).items).toMatchObject([{ text: 'Bread', checked: false }]);
  });

  it('should keep the list behind the login', async () => {
    // Given
    const { app } = await signedInApp();

    // When
    const response = await request(app).get(ITEMS);

    // Then
    expect(response.status).toBe(401);
  });
});
