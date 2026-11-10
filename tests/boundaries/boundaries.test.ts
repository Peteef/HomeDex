import path from 'node:path';
import tseslint from 'typescript-eslint';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { boundaryRules, domainRules, styleRules } from '../../eslint.config.js';

const fixtures = path.join(import.meta.dirname, 'fixtures');

async function violationsOf(file: string): Promise<string[]> {
  const eslint = new ESLint({
    cwd: fixtures,
    overrideConfigFile: true,
    overrideConfig: [
      {
        ...boundaryRules,
        files: ['**/*.ts'],
        languageOptions: { parser: tseslint.parser },
        settings: { ...boundaryRules.settings, 'boundaries/root-path': fixtures },
      },
      ...domainRules,
      styleRules,
    ],
  });
  const [result] = await eslint.lintFiles([file]);
  return (result?.messages ?? []).map((message) => message.ruleId ?? message.message);
}

describe('module boundary rules', () => {
  it.each([
    'src/platform/backend/ok-platform-internal.ts',
    'src/modules/alpha/ok-own-file.ts',
    'src/modules/alpha/ok-platform-api.ts',
  ])('should allow %s', async (file) => {
    expect(await violationsOf(file)).toEqual([]);
  });

  it.each([
    'src/platform/backend/bad-imports-module.ts',
    'src/modules/alpha/bad-other-module.ts',
    'src/modules/alpha/bad-platform-internal.ts',
  ])('should reject %s', async (file) => {
    expect(await violationsOf(file)).toContain('boundaries/dependencies');
  });
});

describe('domain rules', () => {
  const backend = 'src/platform/backend';

  it.each([
    `${backend}/infrastructure/ok-domain-entrypoint.ts`,
    `${backend}/domain/accounts/ok-own-internal.ts`,
    `${backend}/domain/auth/ok-other-domain-entrypoint.ts`,
    `${backend}/domain/auth/ok-storage-entrypoint.ts`,
    `${backend}/domain/auth/__tests__/ok-test-helper.ts`,
    `${backend}/domain/ok-aggregate.ts`,
  ])('should allow %s', async (file) => {
    expect(await violationsOf(file)).toEqual([]);
  });

  it.each([
    `${backend}/infrastructure/bad-domain-internal.ts`,
    `${backend}/infrastructure/bad-domain-file.ts`,
    `${backend}/domain/auth/bad-other-domain-internal.ts`,
    `${backend}/domain/auth/bad-infrastructure.ts`,
    `${backend}/domain/auth/bad-storage-internal.ts`,
    `${backend}/domain/auth/bad-routes.ts`,
    `${backend}/domain/bad-aggregate-internal.ts`,
  ])('should reject %s', async (file) => {
    expect(await violationsOf(file)).toContain('no-restricted-imports');
  });
});

describe('style rules', () => {
  it('should allow a returned object with one property per line', async () => {
    expect(await violationsOf('src/style/ok-returned-object.ts')).toEqual([]);
  });

  it('should reject a returned object with several properties on one line', async () => {
    expect(await violationsOf('src/style/bad-returned-object.ts')).toContain(
      'homedex/returned-object-one-per-line',
    );
  });
});
