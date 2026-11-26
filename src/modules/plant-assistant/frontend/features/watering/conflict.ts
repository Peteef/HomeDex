import { ApiError } from '#platform/frontend';
import { CONFLICT } from '#platform/shared';

// Someone else watered or postponed the plant first, or changed it since the watering (PRD R12).
export const isConflict = (error: unknown): boolean =>
  error instanceof ApiError && error.status === CONFLICT;
