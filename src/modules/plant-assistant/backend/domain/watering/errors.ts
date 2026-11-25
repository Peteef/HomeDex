import type { WateringErrorCode } from './types.ts';

export class WateringError extends Error {
  readonly code: WateringErrorCode;

  constructor(code: WateringErrorCode, message: string) {
    super(message);
    this.name = 'WateringError';
    this.code = code;
  }
}

export const invalidWatering = (message: string): WateringError =>
  new WateringError('invalid', message);

export const plantNotFound = (id: number): WateringError =>
  new WateringError('not_found', `No plant with id ${String(id)}`);

export const wateringNotFound = (id: number): WateringError =>
  new WateringError('not_found', `No watering with id ${String(id)}`);

export const plantNotDue = (id: number): WateringError =>
  new WateringError('conflict', `Plant ${String(id)} is not due`);

export const undoUnavailable = (id: number): WateringError =>
  new WateringError('conflict', `Watering ${String(id)} can no longer be undone`);
