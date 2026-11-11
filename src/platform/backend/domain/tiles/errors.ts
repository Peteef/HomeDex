import type { TileErrorCode } from './types.ts';

export class TileError extends Error {
  readonly code: TileErrorCode;

  constructor(code: TileErrorCode, message: string) {
    super(message);
    this.name = 'TileError';
    this.code = code;
  }
}
