import path from 'node:path';
import { moduleTestStorage } from '#platform/backend/testing';
import { describe, expect, it } from 'vitest';
import { itemRepository } from '../itemRepository.ts';

const MODULE_DIR = path.resolve(import.meta.dirname, '../../../../..');

const MILK = { text: 'Milk', amount: '2 l', addedBy: 'Misty' };
const BREAD = { text: 'Bread', amount: null, addedBy: 'Brock' };

const newRepository = () => itemRepository(moduleTestStorage(MODULE_DIR));

describe('item repository', () => {
  describe('insert and find', () => {
    it('should store a new item unchecked', () => {
      // Given
      const items = newRepository();

      // When
      const id = items.insert(MILK);

      // Then
      expect(items.find(id)).toEqual({
        id,
        text: 'Milk',
        amount: '2 l',
        addedBy: 'Misty',
        checked: false,
      });
    });

    it('should find nothing for an unknown id', () => {
      // When / Then
      expect(newRepository().find(42)).toBeUndefined();
    });
  });

  describe('list', () => {
    it('should list the items in the order they were added', () => {
      // Given
      const items = newRepository();
      items.insert(MILK);
      items.insert(BREAD);
      items.insert({ ...MILK, text: 'Eggs' });

      // When / Then
      expect(items.list().map(({ text }) => text)).toEqual(['Milk', 'Bread', 'Eggs']);
    });
  });

  describe('setChecked', () => {
    it('should check and uncheck an item and say it exists', () => {
      // Given
      const items = newRepository();
      const id = items.insert(MILK);

      // When / Then
      expect(items.setChecked(id, true)).toBe(true);
      expect(items.find(id)?.checked).toBe(true);
      expect(items.setChecked(id, true)).toBe(true);
      expect(items.setChecked(id, false)).toBe(true);
      expect(items.find(id)?.checked).toBe(false);
    });

    it('should say an unknown item does not exist', () => {
      // When / Then
      expect(newRepository().setChecked(42, true)).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove only the given item', () => {
      // Given
      const items = newRepository();
      const id = items.insert(MILK);
      items.insert(BREAD);

      // When
      items.remove(id);

      // Then
      expect(items.list().map(({ text }) => text)).toEqual(['Bread']);
    });
  });

  describe('removeChecked', () => {
    it('should remove the checked items and keep the rest', () => {
      // Given
      const items = newRepository();
      const milk = items.insert(MILK);
      items.insert(BREAD);
      items.setChecked(milk, true);

      // When
      items.removeChecked();

      // Then
      expect(items.list().map(({ text }) => text)).toEqual(['Bread']);
    });
  });
});
