import path from 'node:path';
import tseslint from 'typescript-eslint';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import {
  boundaryRules,
  domainRules,
  frontendRules,
  sharedRules,
  styleRules,
} from '../../eslint.config.js';

const fixtures = path.join(import.meta.dirname, 'fixtures');

const violationsOf = async (file: string): Promise<string[]> => {
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
      ...frontendRules,
      sharedRules,
      styleRules,
    ],
  });
  const [result] = await eslint.lintFiles([file]);
  return (result?.messages ?? []).map((message) => message.ruleId ?? message.message);
};

describe('lint rules', () => {
  describe('module boundaries', () => {
    it.each([
      'src/platform/backend/ok-platform-internal.ts',
      'src/modules/alpha/ok-own-file.ts',
      'src/modules/alpha/ok-platform-api.ts',
    ])('should allow %s', async (file) => {
      // When / Then
      expect(await violationsOf(file)).toEqual([]);
    });

    it.each([
      'src/platform/backend/bad-imports-module.ts',
      'src/modules/alpha/bad-other-module.ts',
      'src/modules/alpha/bad-platform-internal.ts',
    ])('should reject %s', async (file) => {
      // When / Then
      expect(await violationsOf(file)).toContain('boundaries/dependencies');
    });
  });

  describe('domains', () => {
    const backend = 'src/platform/backend';

    it.each([
      `${backend}/infrastructure/ok-domain-entrypoint.ts`,
      `${backend}/domain/accounts/ok-own-internal.ts`,
      `${backend}/domain/auth/ok-other-domain-entrypoint.ts`,
      `${backend}/domain/auth/ok-storage-entrypoint.ts`,
      `${backend}/domain/auth/__tests__/ok-test-helper.ts`,
      `${backend}/domain/ok-aggregate.ts`,
    ])('should allow %s', async (file) => {
      // When / Then
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
      // When / Then
      expect(await violationsOf(file)).toContain('no-restricted-imports');
    });
  });

  describe('frontend layers', () => {
    const frontend = 'src/platform/frontend';

    it.each([
      `${frontend}/components/panel/ok-sibling-component.ts`,
      `${frontend}/pages/home/ok-feature.ts`,
      `${frontend}/pages/home/ok-lib.ts`,
      `${frontend}/pages/home/ok-shared.ts`,
      `${frontend}/features/auth/ok-lib.ts`,
    ])('should allow %s', async (file) => {
      // When / Then
      expect(await violationsOf(file)).toEqual([]);
    });

    it.each([
      `${frontend}/components/panel/bad-page.ts`,
      `${frontend}/components/panel/bad-routes.ts`,
      `${frontend}/components/panel/bad-feature.ts`,
      `${frontend}/components/panel/bad-lib.ts`,
      `${frontend}/pages/home/bad-feature-internal.ts`,
      `${frontend}/pages/home/bad-lib-internal.ts`,
      `${frontend}/features/auth/bad-lib-internal.ts`,
      `${frontend}/features/auth/bad-page.ts`,
      `${frontend}/lib/http/bad-feature.ts`,
    ])('should reject %s', async (file) => {
      // When / Then
      expect(await violationsOf(file)).toContain('no-restricted-imports');
    });
  });

  describe('shared', () => {
    it.each(['src/platform/shared/bad-frontend.ts', 'src/platform/shared/bad-backend.ts'])(
      'should reject %s',
      async (file) => {
        // When / Then
        expect(await violationsOf(file)).toContain('no-restricted-imports');
      },
    );
  });

  describe('style', () => {
    it.each(['src/style/ok-returned-object.ts', 'src/style/ok-arrows-and-methods.ts'])(
      'should allow %s',
      async (file) => {
        // When / Then
        expect(await violationsOf(file)).toEqual([]);
      },
    );

    it.each([
      ['src/style/bad-returned-object.ts', 'homedex/returned-object-one-per-line'],
      ['src/style/bad-function-declaration.ts', 'func-style'],
      ['src/style/bad-function-expression.ts', 'no-restricted-syntax'],
      ['src/style/bad-callback-function.ts', 'prefer-arrow-callback'],
      ['src/style/bad-braceless-if.ts', 'curly'],
      ['src/style/bad-braced-arrow.ts', 'arrow-body-style'],
      ['src/style/bad-concise-object.ts', 'homedex/returned-object-one-per-line'],
    ])('should reject %s with %s', async (file, rule) => {
      // When / Then
      expect(await violationsOf(file)).toContain(rule);
    });
  });
});
