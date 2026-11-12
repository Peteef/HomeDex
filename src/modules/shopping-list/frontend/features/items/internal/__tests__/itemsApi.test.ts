import { fakeApi, ok } from '#platform/frontend/testing';
import { describe, expect, it } from 'vitest';
import { createItem, deleteCheckedItems, deleteItem, fetchItems, saveCheck } from '../itemsApi.ts';

const MILK = { id: 1, text: 'Milk', amount: '2 l', addedBy: 'Misty', checked: false };
const NO_CONTENT = { status: 204 };

describe('items API', () => {
  it('should fetch the items', async () => {
    // Given
    fakeApi({ 'GET /api/m/shopping-list/items': ok({ items: [MILK] }) });

    // When / Then
    expect(await fetchItems()).toEqual([MILK]);
  });

  it('should create an item and return the saved one', async () => {
    // Given
    const api = fakeApi({ 'POST /api/m/shopping-list/items': ok({ item: MILK }) });

    // When
    const item = await createItem({ text: 'Milk', amount: '2 l' });

    // Then
    expect(item).toEqual(MILK);
    expect(api.calls[0]?.body).toEqual({ text: 'Milk', amount: '2 l' });
  });

  it('should check an item with PUT and uncheck it with DELETE', async () => {
    // Given
    const api = fakeApi({
      'PUT /api/m/shopping-list/items/1/check': NO_CONTENT,
      'DELETE /api/m/shopping-list/items/1/check': NO_CONTENT,
    });

    // When
    await saveCheck({ id: 1, checked: true });
    await saveCheck({ id: 1, checked: false });

    // Then
    expect(api.calls.map(({ method, url }) => `${method} ${url}`)).toEqual([
      'PUT /api/m/shopping-list/items/1/check',
      'DELETE /api/m/shopping-list/items/1/check',
    ]);
  });

  it('should delete an item', async () => {
    // Given
    const api = fakeApi({ 'DELETE /api/m/shopping-list/items/1': NO_CONTENT });

    // When
    await deleteItem(1);

    // Then
    expect(api.callsTo('DELETE /api/m/shopping-list/items/1')).toHaveLength(1);
  });

  it('should delete the checked items', async () => {
    // Given
    const api = fakeApi({ 'DELETE /api/m/shopping-list/checked-items': NO_CONTENT });

    // When
    await deleteCheckedItems();

    // Then
    expect(api.callsTo('DELETE /api/m/shopping-list/checked-items')).toHaveLength(1);
  });

  it('should reject when the server answers with an error', async () => {
    // Given
    fakeApi({});

    // When / Then
    await expect(deleteItem(1)).rejects.toThrow('404');
  });
});
