import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPT = path.join(import.meta.dirname, '..', 'check-release-notes.ts');

const runScript = (...args: string[]) => {
  const result = spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });

  return {
    status: result.status,
    output: result.stdout,
    errors: result.stderr,
  };
};

const body = (releaseNotes: string): string =>
  [
    '## What changed and why',
    '',
    'Adds a shopping list.',
    '',
    '## Release notes',
    '',
    '<!-- Only for release:minor and release:major.',
    '## Not a real heading',
    '-->',
    releaseNotes,
    '',
    '## How it was tested',
    '',
    'Unit tests.',
  ].join('\n');

describe('check-release-notes', () => {
  it('should pass without release notes when the pull request is a patch', () => {
    // When
    const result = runScript('["release:patch"]', body(''));

    // Then
    expect(result.status).toBe(0);
    expect(result.output).toContain('no release notes needed');
  });

  it('should pass when a minor pull request has release notes under a ### heading', () => {
    // When
    const result = runScript(
      '["release:minor"]',
      body('### Shared shopping list\n\nOne list for the whole household.'),
    );

    // Then
    expect(result.status).toBe(0);
    expect(result.output).toContain('Release notes found.');
  });

  it('should fail when a major pull request leaves the release notes empty', () => {
    // When
    const result = runScript('["release:major"]', body(''));

    // Then
    expect(result.status).toBe(1);
    expect(result.errors).toContain('needs its "## Release notes" section filled');
    expect(result.errors).toContain('docs/releases.md');
  });

  it('should fail when a minor pull request has no release notes section', () => {
    // When
    const result = runScript('["release:minor"]', '## What changed and why\n\nA fix.');

    // Then
    expect(result.status).toBe(1);
    expect(result.errors).toContain('needs its "## Release notes" section filled');
  });

  it('should fail when the release notes do not start with a ### heading', () => {
    // When
    const result = runScript('["release:minor"]', body('One list for the whole household.'));

    // Then
    expect(result.status).toBe(1);
    expect(result.errors).toContain('must start with a ### heading');
  });

  it('should fail when the pull request carries two release labels', () => {
    // When
    const result = runScript(
      '["dependencies", "release:minor", "release:patch"]',
      body('### Shared shopping list'),
    );

    // Then
    expect(result.status).toBe(1);

    expect(result.errors).toContain(
      'keep one release:* label and remove the others: release:minor, release:patch',
    );
  });

  it('should pass when the release label comes with other labels', () => {
    // When
    const result = runScript('["dependencies", "release:patch"]', body(''));

    // Then
    expect(result.status).toBe(0);
  });

  it('should fail with the usage when an argument is missing', () => {
    // When
    const result = runScript('["release:minor"]');

    // Then
    expect(result.status).toBe(1);
    expect(result.errors).toContain('Usage: node scripts/check-release-notes.ts');
  });
});
