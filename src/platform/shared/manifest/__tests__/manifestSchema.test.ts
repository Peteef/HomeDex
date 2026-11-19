import { describe, expect, it } from 'vitest';
import { manifestSchema } from '../manifestSchema.ts';

const NOTES = {
  id: 'quick-notes',
  icon: 'notes',
  route: '/m/quick-notes',
  enabled: true,
};

const problemsOf = (manifest: unknown): string[] => {
  const result = manifestSchema.safeParse(manifest);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
};

describe('manifest schema', () => {
  it('should accept a minimal manifest', () => {
    // When / Then
    expect(problemsOf(NOTES)).toEqual([]);
  });

  it('should accept quick actions', () => {
    // Given
    const manifest = {
      ...NOTES,
      quickActions: [{ id: 'add-note', keyword: 'note' }],
    };

    // When / Then
    expect(problemsOf(manifest)).toEqual([]);
  });

  it.each([1, 1024, 5120])(
    'should accept a body limit when it is a whole number of kB within range (%s)',
    (requestBodyLimitKb) => {
      // When / Then
      expect(problemsOf({ ...NOTES, requestBodyLimitKb })).toEqual([]);
    },
  );

  it.each([0, 1.5, 5121])(
    'should reject a body limit when it is 0, fractional or above 5120 (%s)',
    (requestBodyLimitKb) => {
      // When / Then
      expect(problemsOf({ ...NOTES, requestBodyLimitKb })).toEqual(['requestBodyLimitKb']);
    },
  );

  it.each([
    ['an id that is not kebab-case', { id: 'Quick_Notes', route: '/m/Quick_Notes' }, 'id'],
    ['an id with a trailing hyphen', { id: 'notes-', route: '/m/notes-' }, 'id'],
    ['a name, which belongs in the locale files', { name: 'Quick notes' }, ''],
    ['a description, which belongs in the locale files', { description: 'Notes' }, ''],
    ['an unknown icon', { icon: 'rocket' }, 'icon'],
    ['a route that is not /m/<id>', { route: '/notes' }, 'route'],
    ['a missing enabled flag', { enabled: undefined }, 'enabled'],
    ['an unknown field', { type: 'module' }, ''],
    [
      'a quick action keyword of two words',
      { quickActions: [{ id: 'add', keyword: 'add note' }] },
      'quickActions.0.keyword',
    ],
    [
      'a quick action label, which belongs in the locale files',
      { quickActions: [{ id: 'add', keyword: 'note', label: 'Add' }] },
      'quickActions.0',
    ],
  ])('should reject %s', (_case, change, path) => {
    // When / Then
    expect(problemsOf({ ...NOTES, ...change })).toEqual([path]);
  });
});
