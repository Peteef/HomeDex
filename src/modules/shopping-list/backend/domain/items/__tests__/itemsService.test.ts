import path from 'node:path';
import { moduleTestStorage } from '#platform/backend/testing';
import { describe, expect, it } from 'vitest';
import { ItemError, itemsService } from '../index.ts';

const MODULE_DIR = path.resolve(import.meta.dirname, '../../../..');

const newService = () => {
  const clock = { now: 1_000 };
  const service = itemsService(moduleTestStorage(MODULE_DIR), { now: () => clock.now });

  return {
    service,
    clock,
  };
};

const texts = (service: ReturnType<typeof itemsService>) =>
  service.list().map(({ text, checked }) => [text, checked]);

describe('items service', () => {
  describe('add', () => {
    it('should add an item with its amount and who added it', () => {
      // Given
      const { service } = newService();

      // When
      const item = service.add('Misty', { text: 'Milk', amount: '2 l' });

      // Then
      expect(item).toEqual({
        id: item.id,
        text: 'Milk',
        amount: '2 l',
        addedBy: 'Misty',
        checked: false,
      });

      expect(service.list()).toEqual([item]);
    });

    it('should trim the text and store a blank amount as none', () => {
      // Given
      const { service } = newService();

      // When
      const item = service.add('Misty', { text: '  Bread ', amount: '   ' });

      // Then
      expect(item).toMatchObject({ text: 'Bread', amount: null });
    });

    it('should allow the same item twice', () => {
      // Given
      const { service } = newService();
      service.add('Misty', { text: 'Eggs' });

      // When
      service.add('Brock', { text: 'Eggs' });

      // Then
      expect(texts(service)).toEqual([
        ['Eggs', false],
        ['Eggs', false],
      ]);
    });

    it.each([
      ['an empty text', { text: '  ' }],
      ['a text over 100 characters', { text: 'a'.repeat(101) }],
      ['an amount over 30 characters', { text: 'Milk', amount: '1'.repeat(31) }],
    ])('should reject %s', (_case, item) => {
      // Given
      const { service } = newService();

      // When / Then
      expect(() => service.add('Misty', item)).toThrow(ItemError);
      expect(service.list()).toEqual([]);
    });
  });

  describe('list', () => {
    it('should list the items oldest first', () => {
      // Given
      const { service, clock } = newService();
      service.add('Misty', { text: 'Milk' });
      clock.now = 500;
      service.add('Misty', { text: 'Bread' });
      clock.now = 2_000;
      service.add('Misty', { text: 'Eggs' });

      // When / Then
      expect(texts(service)).toEqual([
        ['Bread', false],
        ['Milk', false],
        ['Eggs', false],
      ]);
    });
  });

  describe('check and uncheck', () => {
    it('should check and uncheck an item', () => {
      // Given
      const { service } = newService();
      const { id } = service.add('Misty', { text: 'Milk' });

      // When
      service.check(id);
      service.check(id);

      // Then
      expect(texts(service)).toEqual([['Milk', true]]);

      // When
      service.uncheck(id);

      // Then
      expect(texts(service)).toEqual([['Milk', false]]);
    });

    it('should reject an item that does not exist', () => {
      // Given
      const { service } = newService();

      // When / Then
      expect(() => {
        service.check(42);
      }).toThrow('No item with id 42');

      expect(() => {
        service.uncheck(42);
      }).toThrow(ItemError);
    });
  });

  describe('remove', () => {
    it('should remove an item and ignore one that is already gone', () => {
      // Given
      const { service } = newService();
      const { id } = service.add('Misty', { text: 'Milk' });
      service.add('Misty', { text: 'Bread' });

      // When
      service.remove(id);
      service.remove(id);

      // Then
      expect(texts(service)).toEqual([['Bread', false]]);
    });
  });

  describe('clearChecked', () => {
    it('should remove only the checked items', () => {
      // Given
      const { service } = newService();
      const milk = service.add('Misty', { text: 'Milk' });
      service.add('Misty', { text: 'Bread' });
      service.check(milk.id);

      // When
      service.clearChecked();

      // Then
      expect(texts(service)).toEqual([['Bread', false]]);
    });
  });
});
