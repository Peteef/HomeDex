import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPT = path.join(import.meta.dirname, '..', 'next-version.ts');

const runScript = (...args: string[]) => {
  const result = spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });

  return {
    status: result.status,
    output: result.stdout,
    errors: result.stderr,
  };
};

describe('next-version', () => {
  it('should bump the patch version without a release when the merge has no release label', () => {
    // When
    const result = runScript('v1.4.1', '[{"sha":"a1","labels":["dependencies"]}]');

    // Then
    expect(result.status).toBe(0);

    expect(result.output).toBe(
      'version=1.4.2\nrelease=false\nmerges=[{"sha":"a1","version":"1.4.2","release":false}]\n',
    );
  });

  it('should bump the minor version with a release when the merge is release:minor', () => {
    // When
    const result = runScript('v1.4.2', '[{"sha":"a1","labels":["release:minor"]}]');

    // Then
    expect(result.status).toBe(0);
    expect(result.output).toContain('version=1.5.0\nrelease=true\n');
  });

  it('should bump the major version when a merge has both release:major and release:minor', () => {
    // When
    const result = runScript('v1.5.0', '[{"sha":"a1","labels":["release:minor","release:major"]}]');

    // Then
    expect(result.status).toBe(0);
    expect(result.output).toContain('version=2.0.0\nrelease=true\n');
  });

  it('should give every merge its own version in order when several merges are untagged', () => {
    // When
    const result = runScript(
      'v1.4.1',
      JSON.stringify([
        { sha: 'a1', labels: ['release:patch'] },
        { sha: 'b2', labels: ['release:minor'] },
        { sha: 'c3', labels: [] },
      ]),
    );

    // Then
    expect(result.status).toBe(0);

    expect(result.output).toBe(
      [
        'version=1.5.1',
        'release=false',
        'merges=[{"sha":"a1","version":"1.4.2","release":false},{"sha":"b2","version":"1.5.0","release":true},{"sha":"c3","version":"1.5.1","release":false}]',
        '',
      ].join('\n'),
    );
  });

  it('should start from 0.0.0 when there is no version tag yet', () => {
    // When
    const result = runScript('', '[{"sha":"a1","labels":["release:major"]}]');

    // Then
    expect(result.status).toBe(0);
    expect(result.output).toContain('version=1.0.0\nrelease=true\n');
  });

  it('should fail when the last tag is not a version', () => {
    // When
    const result = runScript('latest', '[{"sha":"a1","labels":[]}]');

    // Then
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors).toContain('"latest" is not a version tag');
  });

  it('should fail when there are no merges', () => {
    // When
    const result = runScript('v1.4.1', '[]');

    // Then
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors).toContain('No merges to version');
  });

  it('should fail when the merges are not a JSON array of merges', () => {
    // When
    const result = runScript('v1.4.1', '["release:minor"]');

    // Then
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
  });

  it('should fail with the usage when an argument is missing', () => {
    // When
    const result = runScript('v1.4.1');

    // Then
    expect(result.status).toBe(1);
    expect(result.errors).toContain('Usage: node scripts/next-version.ts');
  });
});
