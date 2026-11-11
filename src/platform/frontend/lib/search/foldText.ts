const COMBINING_MARKS = /\p{M}/gu;

// Text as quick-find compares it: lower case, without accents, so "zakupow" finds "zakupów". "ł" is
// a letter of its own rather than "l" with a mark, so it needs its own step.
export const foldText = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '').replaceAll('ł', 'l');
