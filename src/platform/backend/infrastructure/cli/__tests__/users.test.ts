import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../../../../../..');
const CLI = path.join(root, 'src/platform/backend/infrastructure/cli/users.ts');
const PASSWORD = 'correct-horse-battery';

describe('users CLI', () => {
  let dataDir: string;

  const run = (args: string[], input = ''): { code: number | null; out: string; err: string } => {
    const result = spawnSync('node', [CLI, ...args], {
      cwd: root,
      env: { ...process.env, DATA_DIR: dataDir },
      input,
      encoding: 'utf8',
    });
    return { code: result.status, out: result.stdout, err: result.stderr };
  };

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-cli-'));
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  it('should create an account from flags and list it', () => {
    const created = run(['create', '--username', 'ash', '--password', PASSWORD]);
    expect(created.code).toBe(0);
    expect(created.out).toContain('Created account "ash"');
    const listed = run(['list']);
    expect(listed.out).toContain('ash');
    expect(listed.out).not.toContain(PASSWORD);
  });

  it('should read the password from stdin when no terminal is attached', () => {
    expect(run(['create', 'misty'], `${PASSWORD}\n`).code).toBe(0);
    expect(run(['list']).out).toContain('misty');
  });

  it('should fail with a clear message when the username is missing and there is no terminal', () => {
    const result = run(['create', '--password', PASSWORD]);
    expect(result.code).toBe(1);
    expect(result.err).toContain('Missing username');
  });

  it('should fail when the password is too short', () => {
    const result = run(['create', 'ash', '--password', 'short']);
    expect(result.code).toBe(1);
    expect(result.err).toContain('at least 8 characters');
  });

  it('should fail when the username is taken', () => {
    run(['create', 'ash', '--password', PASSWORD]);
    const result = run(['create', 'ASH', '--password', PASSWORD]);
    expect(result.code).toBe(1);
    expect(result.err).toContain('already taken');
  });

  it('should rename an account and change its password', () => {
    run(['create', 'ash', '--password', PASSWORD]);
    const edited = run(['edit', 'ash', '--username', 'ash2', '--password', 'another-password']);
    expect(edited.code).toBe(0);
    expect(edited.out).toContain('signed out');
    expect(run(['list']).out).toContain('ash2');
  });

  it('should refuse to edit without changes when there is no terminal', () => {
    run(['create', 'ash', '--password', PASSWORD]);
    const result = run(['edit', 'ash']);
    expect(result.code).toBe(1);
    expect(result.err).toContain('Nothing to change');
  });

  it('should refuse to archive without --yes when there is no terminal', () => {
    run(['create', 'ash', '--password', PASSWORD]);
    const result = run(['archive', 'ash']);
    expect(result.code).toBe(1);
    expect(result.err).toContain('--yes');
  });

  it('should hide an archived account from the list until it is shown with --all or restored', () => {
    run(['create', 'ash', '--password', PASSWORD]);
    expect(run(['archive', 'ash', '--yes']).code).toBe(0);
    expect(run(['list']).out).not.toContain('ash  created');
    expect(run(['list', '--all']).out).toContain('(archived)');
    expect(run(['restore', 'ash']).code).toBe(0);
    expect(run(['list']).out).toContain('ash');
  });

  it('should fail when the user does not exist', () => {
    const result = run(['archive', 'nobody', '--yes']);
    expect(result.code).toBe(1);
    expect(result.err).toContain('No user named "nobody"');
  });

  it('should print the usage when the command is missing or unknown', () => {
    expect(run([]).err).toContain('Usage:');
    const unknown = run(['frobnicate']);
    expect(unknown.code).toBe(1);
    expect(unknown.err).toContain('Unknown command');
  });
});
