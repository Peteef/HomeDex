export const MIN_POSTPONE_DAYS = 1;
export const MAX_POSTPONE_DAYS = 30;
export const QUICK_POSTPONE_DAYS = [1, 2, 3];

export const isPostponeDays = (days: number): boolean =>
  Number.isInteger(days) && days >= MIN_POSTPONE_DAYS && days <= MAX_POSTPONE_DAYS;
