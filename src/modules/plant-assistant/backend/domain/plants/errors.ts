import type { PlantErrorCode } from './types.ts';

export class PlantError extends Error {
  readonly code: PlantErrorCode;

  constructor(code: PlantErrorCode, message: string) {
    super(message);
    this.name = 'PlantError';
    this.code = code;
  }
}

export const invalidPlant = (message: string): PlantError => new PlantError('invalid', message);

export const plantNotFound = (id: number): PlantError =>
  new PlantError('not_found', `No plant with id ${String(id)}`);
