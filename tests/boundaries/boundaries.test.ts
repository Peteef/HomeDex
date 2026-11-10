import path from 'node:path';
import tseslint from 'typescript-eslint';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { boundaryRules } from '../../eslint.config.js';

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
  ])('allows %s', async (file) => {
    expect(await violationsOf(file)).toEqual([]);
  });

  it.each([
    'src/platform/backend/bad-imports-module.ts',
    'src/modules/alpha/bad-other-module.ts',
    'src/modules/alpha/bad-platform-internal.ts',
  ])('rejects %s', async (file) => {
    expect(await violationsOf(file)).toContain('boundaries/dependencies');
  });
});
