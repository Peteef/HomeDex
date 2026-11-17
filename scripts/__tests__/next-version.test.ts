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
  it('should bump the patch version without a release when no release label matched', () => {
    // When
    const result = runScript('v1.4.1', '[]');

    // Then
    expect(result.status).toBe(0);
    expect(result.output).toBe('version=1.4.2\nrelease=false\n');
  });

  it('should bump the minor version with a release when a pull request is release:minor', () => {
    // When
    const result = runScript('v1.4.2', '["release:minor"]');

    // Then
    expect(result.status).toBe(0);
    expect(result.output).toBe('version=1.5.0\nrelease=true\n');
  });

  it('should bump the major version with a release when any pull request is release:major', () => {
    // When
    const result = runScript('v1.5.0', '["release:major","release:minor"]');

    // Then
    expect(result.status).toBe(0);
    expect(result.output).toBe('version=2.0.0\nrelease=true\n');
  });

  it('should fail when the last tag is not a version', () => {
    // When
    const result = runScript('latest', '[]');

    // Then
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors).toContain('"latest" is not a version tag');
  });

  it('should fail when the labels are not a JSON array of strings', () => {
    // When
    const result = runScript('v1.4.1', '{"release":"minor"}');

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
