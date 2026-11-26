export const MIN_POSTPONE_DAYS = 1;
export const MAX_POSTPONE_DAYS = 30;
export const QUICK_POSTPONE_DAYS = [1, 2, 3];

const WHOLE_NUMBER = /^\d+$/;

export const parsePostponeDays = (text: string): number | null => {
  const days = Number(text.trim());

  return WHOLE_NUMBER.test(text.trim()) && days >= MIN_POSTPONE_DAYS && days <= MAX_POSTPONE_DAYS
    ? days
    : null;
};
