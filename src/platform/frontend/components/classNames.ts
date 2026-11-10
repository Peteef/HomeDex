export const classNames = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(' ');
