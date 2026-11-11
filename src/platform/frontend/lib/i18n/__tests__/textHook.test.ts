import { act, renderHook } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';
import { textHook } from '../index.ts';
import type { Text } from '../index.ts';

const english = {
  cart: {
    title: 'Cart',
    greeting: 'Hi, {{name}}! You have {{count, number}} coupons.',
    items_one: '{{count}} item',
    items_other: '{{count}} items',
    empty: { title: 'Nothing here', hint: 'Add something' },
    onlyInEnglish: 'English only',
  },
} as const;

const polish = {
  cart: {
    title: 'Koszyk',
    greeting: 'Cześć, {{name}}! Masz {{count, number}} kuponów.',
    items_one: '{{count}} produkt',
    items_few: '{{count}} produkty',
    items_many: '{{count}} produktów',
    items_other: '{{count}} produktu',
    empty: { title: 'Pusto', hint: 'Dodaj coś' },
  },
};

const NAMESPACE = 'text-hook-test';

// The test namespace is not one of the app's typed namespaces, so the hook is typed by hand.
const useCart = textHook(NAMESPACE as never) as unknown as (
  prefix: 'cart',
) => Text<(typeof english)['cart']>;

const renderCart = () => renderHook(() => useCart('cart')).result;

describe('textHook', () => {
  beforeAll(() => {
    i18next.addResourceBundle('en', NAMESPACE, english);
    i18next.addResourceBundle('pl', NAMESPACE, polish);
  });

  afterEach(async () => {
    await i18next.changeLanguage('en');
  });

  it('should give text without values as a string', () => {
    // When
    const text = renderCart();

    // Then
    expectTypeOf(text.current.title).toBeString();
    expect(text.current.title).toBe('Cart');
  });

  it('should give text with values as a function that fills them in', () => {
    // When
    const text = renderCart();

    // Then
    expectTypeOf(text.current.greeting).parameter(0).toEqualTypeOf<{
      name: string | number;
      count: string | number;
    }>();

    expect(text.current.greeting({ name: 'Misty', count: 2 })).toBe(
      'Hi, Misty! You have 2 coupons.',
    );
  });

  it('should give plural forms as one function that picks the form for the count', () => {
    // When
    const text = renderCart();

    // Then
    expectTypeOf(text.current.items).toBeFunction();
    expect(text.current.items({ count: 1 })).toBe('1 item');
    expect(text.current.items({ count: 3 })).toBe('3 items');
  });

  it('should give a nested section as an object of its own', () => {
    // When
    const text = renderCart();

    // Then
    expect(text.current.empty.title).toBe('Nothing here');
    expect(text.current.empty.hint).toBe('Add something');
  });

  it('should give the text in the current language', async () => {
    // Given
    const text = renderCart();

    // When
    await act(() => i18next.changeLanguage('pl'));

    // Then
    expect(text.current.title).toBe('Koszyk');
    expect(text.current.empty.title).toBe('Pusto');

    expect(text.current.greeting({ name: 'Misty', count: 2 })).toBe(
      'Cześć, Misty! Masz 2 kuponów.',
    );
  });

  it("should pick the current language's plural form when it has more forms than English", async () => {
    // Given
    const text = renderCart();

    // When
    await act(() => i18next.changeLanguage('pl'));

    // Then
    expect(text.current.items({ count: 1 })).toBe('1 produkt');
    expect(text.current.items({ count: 3 })).toBe('3 produkty');
    expect(text.current.items({ count: 5 })).toBe('5 produktów');
  });

  it('should fall back to English when the current language misses a message', async () => {
    // Given
    const text = renderCart();

    // When
    await act(() => i18next.changeLanguage('pl'));

    // Then
    expect(text.current.onlyInEnglish).toBe('English only');
  });
});
