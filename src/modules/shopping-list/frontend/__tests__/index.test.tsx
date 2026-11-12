import { fakeApi, ok, withProviders } from '#platform/frontend/testing';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ShoppingList from '../index.tsx';

describe('shopping list module page', () => {
  it('should show the list at the module route', async () => {
    // Given
    fakeApi({ 'GET /api/m/shopping-list/items': ok({ items: [] }) });

    // When
    render(withProviders(<ShoppingList />));

    // Then
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Shopping list' }),
    ).toBeInTheDocument();
  });
});
