const COMBINING_MARKS = /\p{M}/gu;

// NFD splits "ó" into "o" plus a mark, but "ł" is a letter of its own, so it is replaced by hand.
export const foldText = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '').replaceAll('ł', 'l');
