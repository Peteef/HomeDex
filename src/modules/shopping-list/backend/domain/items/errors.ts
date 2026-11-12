import type { ItemErrorCode } from './types.ts';

export class ItemError extends Error {
  readonly code: ItemErrorCode;

  constructor(code: ItemErrorCode, message: string) {
    super(message);
    this.name = 'ItemError';
    this.code = code;
  }
}

export const invalidItem = (message: string): ItemError => new ItemError('invalid', message);

export const itemNotFound = (id: number): ItemError =>
  new ItemError('not_found', `No item with id ${String(id)}`);
