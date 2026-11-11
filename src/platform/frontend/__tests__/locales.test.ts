import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '../lib/i18n/index.ts';

// Every locale file of the platform and of every module, enabled or not, checked against English.
// The Translation type catches most gaps in a file that uses it; this also covers what types can't:
// extra values, markup tags, the plural forms each language needs, and files that skip the type.

type Messages = Record<string, unknown>;

const FILES = import.meta.glob<Messages>(
  [
    '/src/platform/frontend/locales/*.ts',
    '/src/modules/*/frontend/locales/*.ts',
    '!/src/modules/*/frontend/locales/index.ts',
  ],
  { eager: true, import: 'default' },
);

const SOURCE = 'en';
const SUPPORTED = LANGUAGES.map(({ code }) => code).sort();
const PLURAL_KEY = /^(?<base>.+)_(?<form>zero|one|two|few|many|other)$/;
const PLACEHOLDER = /\{\{\s*(?<name>[^},\s]+)[^}]*\}\}/g;
const TAG = /<\/?(?<name>[\w-]+)\s*\/?>/g;

const localesByFolder = (): Map<string, Map<string, Messages>> => {
  const folders = new Map<string, Map<string, Messages>>();

  for (const [path, messages] of Object.entries(FILES)) {
    const slash = path.lastIndexOf('/');
    const folder = path.slice(0, slash);
    const language = path.slice(slash + 1).replace(/\.ts$/, '');
    const languages = folders.get(folder) ?? new Map<string, Messages>();
    languages.set(language, messages);
    folders.set(folder, languages);
  }

  return folders;
};

const flatten = (messages: Messages, prefix = ''): Map<string, unknown> =>
  new Map(
    Object.entries(messages).flatMap(([key, value]) => {
      const path = prefix === '' ? key : `${prefix}.${key}`;
      return typeof value === 'object' && value !== null
        ? [...flatten(value as Messages, path)]
        : [[path, value] as const];
    }),
  );

const namesOf = (message: string, pattern: RegExp): string[] =>
  [...new Set([...message.matchAll(pattern)].map(({ groups }) => groups?.name ?? ''))].sort();

const pluralBaseOf = (key: string): string | undefined => PLURAL_KEY.exec(key)?.groups?.base;

const pluralFormsOf = (language: string): string[] =>
  [...new Intl.PluralRules(language).resolvedOptions().pluralCategories].sort();

const keysWithoutPlurals = (messages: Map<string, unknown>): string[] =>
  [...messages.keys()].filter((key) => pluralBaseOf(key) === undefined).sort();

const pluralKeysOf = (messages: Map<string, unknown>, language: string): string[] => {
  const bases = new Set(
    [...messages.keys()].map(pluralBaseOf).filter((base) => base !== undefined),
  );

  return [...bases]
    .flatMap((base) => pluralFormsOf(language).map((form) => `${base}_${form}`))
    .sort();
};

const valuesOf = (messages: Map<string, unknown>, key: string, pattern: RegExp): string[] => {
  const base = pluralBaseOf(key);

  const group =
    base === undefined
      ? [key]
      : [...messages.keys()].filter((other) => pluralBaseOf(other) === base);

  return [
    ...new Set(group.flatMap((other) => namesOf(String(messages.get(other)), pattern))),
  ].sort();
};

describe('locales', () => {
  for (const [folder, languages] of localesByFolder()) {
    describe(folder, () => {
      const source = flatten(languages.get(SOURCE) ?? {});

      it('should have a file for every supported language and no other', () => {
        // When / Then
        expect([...languages.keys()].sort()).toEqual(SUPPORTED);
      });

      for (const [language, file] of languages) {
        describe(language, () => {
          const messages = flatten(file);

          it('should have the same keys as English', () => {
            // When / Then
            expect(keysWithoutPlurals(messages)).toEqual(keysWithoutPlurals(source));
          });

          it('should have exactly the plural forms the language needs', () => {
            // Given
            const expected = pluralKeysOf(source, language);

            // When
            const actual = [...messages.keys()]
              .filter((key) => pluralBaseOf(key) !== undefined)
              .sort();

            // Then
            expect(actual).toEqual(expected);
          });

          it('should have only non-empty text', () => {
            // When
            const empty = [...messages].filter(
              ([, message]) => typeof message !== 'string' || message.trim() === '',
            );

            // Then
            expect(empty).toEqual([]);
          });

          it('should use the same values and markup as English', () => {
            // When
            const different = [...messages.keys()]
              .filter((key) => source.has(key) || pluralBaseOf(key) !== undefined)
              .flatMap((key) =>
                [PLACEHOLDER, TAG].flatMap((pattern) => {
                  const actual = namesOf(String(messages.get(key)), pattern);
                  const expected = valuesOf(source, key, pattern);
                  const unknown = actual.filter((name) => !expected.includes(name));

                  const missing =
                    pluralBaseOf(key) === undefined
                      ? expected.filter((name) => !actual.includes(name))
                      : [];

                  return unknown.length + missing.length > 0 ? [{ key, unknown, missing }] : [];
                }),
              );

            // Then
            expect(different).toEqual([]);
          });
        });
      }
    });
  }
});
