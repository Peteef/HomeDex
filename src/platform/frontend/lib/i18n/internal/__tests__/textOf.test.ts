import { describe, expect, it, vi } from 'vitest';
import { sectionOf, textOf } from '../textOf.ts';

const messages = {
  home: {
    title: 'Home',
    greeting: 'Hello {{username}}!',
    tiles_one: '{{count}} tile',
    tiles_other: '{{count}} tiles',
    search: {
      label: 'Find a tile',
    },
  },
};

const fakeTranslate = () =>
  vi.fn((key: string, values?: object) => `${key}|${JSON.stringify(values)}`);

describe('textOf', () => {
  describe('sectionOf', () => {
    it('should return the subtree when the dotted path exists', () => {
      // When
      const section = sectionOf(messages, 'home.search');

      // Then
      expect(section).toEqual({ label: 'Find a tile' });
    });

    it.each([
      ['the path is missing', messages, 'home.missing'],
      ['the source is not an object', 'home', 'home'],
    ])('should return an empty object when %s', (_case, source, prefix) => {
      // When
      const section = sectionOf(source, prefix);

      // Then
      expect(section).toEqual({});
    });
  });

  describe('textOf', () => {
    it('should translate with the full key when the message has no values', () => {
      // Given
      const translate = fakeTranslate();
      const text = textOf(translate, messages.home, 'home');

      // When
      const title = text.title;

      // Then
      expect(title).toBe('home.title|undefined');
      expect(translate).toHaveBeenCalledWith('home.title');
    });

    it('should return a function that passes the values on when the message has values', () => {
      // Given
      const translate = fakeTranslate();
      const text = textOf(translate, messages.home, 'home');

      // When
      const greeting = (text.greeting as (values: object) => string)({ username: 'Misty' });

      // Then
      expect(greeting).toBe('home.greeting|{"username":"Misty"}');
    });

    it('should return one function under the base name when the message has plural forms', () => {
      // Given
      const translate = fakeTranslate();
      const text = textOf(translate, messages.home, 'home');

      // When
      const tiles = (text.tiles as (values: object) => string)({ count: 2 });

      // Then
      expect(tiles).toBe('home.tiles|{"count":2}');
    });

    it('should wrap a nested object with the longer path when the message is a section', () => {
      // Given
      const translate = fakeTranslate();
      const text = textOf(translate, messages.home, 'home');

      // When
      const label = (text.search as Record<string, unknown>).label;

      // Then
      expect(label).toBe('home.search.label|undefined');
    });

    it('should return undefined when the key is unknown', () => {
      // Given
      const text = textOf(fakeTranslate(), messages.home, 'home');

      // When / Then
      expect(text.missing).toBeUndefined();
    });
  });
});
