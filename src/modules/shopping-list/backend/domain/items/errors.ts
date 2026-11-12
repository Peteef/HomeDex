import type { ItemErrorCode } from './types.ts';

export class ItemError extends Error {
  readonly code: ItemErrorCode;

  constructor(code: ItemErrorCode, message: string) {
    super(message);
    this.name = 'ItemError';
    this.code = code;
  }
}
