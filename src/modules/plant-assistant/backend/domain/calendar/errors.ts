import type { CalendarErrorCode } from './types.ts';

export class CalendarError extends Error {
  readonly code: CalendarErrorCode;

  constructor(code: CalendarErrorCode, message: string) {
    super(message);
    this.name = 'CalendarError';
    this.code = code;
  }
}

export const invalidMonth = (message: string): CalendarError =>
  new CalendarError('invalid', message);
