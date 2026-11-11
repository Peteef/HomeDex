import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import boundaries from 'eslint-plugin-boundaries';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Platform never imports modules. A module imports only its own files and the platform public
// APIs (#platform/*), never another module.
/** @type {import('eslint').Linter.Config} */
export const boundaryRules = {
  plugins: { boundaries },
  settings: {
    'import/resolver': { typescript: { project: './tsconfig.json' } },
    'boundaries/elements': [
      { type: 'platform', pattern: 'src/platform/*', capture: ['side'] },
      { type: 'module', pattern: 'src/modules/*', capture: ['id'] },
    ],
  },
  rules: {
    ...boundaries.configs.recommended.rules,
    'boundaries/dependencies': [
      'error',
      {
        default: 'disallow',
        policies: [
          {
            from: { element: { type: 'platform' } },
            allow: { to: { element: { type: 'platform' } } },
          },
          {
            from: { element: { type: 'module' } },
            allow: {
              to: { element: { type: 'module', captured: { id: '{{ from.captured.id }}' } } },
            },
          },
          {
            from: { element: { type: 'module' } },
            allow: {
              to: { element: { type: 'platform' }, file: { path: 'src/platform/*/api/index.ts' } },
            },
          },
        ],
      },
    ],
  },
};

// Backend layout: domain/<name>/ holds the logic of one area behind an index.ts, the only file
// other code may import. infrastructure/ holds the technical side (HTTP, storage, config, CLI).
// Domains use infrastructure only through the storage entrypoint.
const BACKEND_DIR = 'src/platform/backend';
const DOMAIN_DIR = `${BACKEND_DIR}/domain`;
const DOMAINS = ['accounts', 'auth', 'tiles'];

const entrypointOnly = (folder) => ({
  group: [`**/${folder}/**`, `!**/${folder}/index.ts`],
  message: `Import ${folder} only through its index.ts.`,
});

const siblingDomains = (domain) =>
  DOMAINS.filter((other) => other !== domain).map((other) => entrypointOnly(other));

const storageEntrypointOnly = {
  // The directory is re-included first, because gitignore-style patterns cannot re-include a file
  // inside an excluded directory.
  group: [
    '**/infrastructure/**',
    '!**/infrastructure/storage',
    '!**/infrastructure/storage/index.ts',
  ],
  message: 'Domains may use infrastructure only through storage/index.ts.',
};

const notRoutes = {
  group: ['**/routes/**'],
  message: 'Domains must not depend on routes.',
};

const restrictImports = (patterns) => ({ 'no-restricted-imports': ['error', { patterns }] });

/** @type {import('eslint').Linter.Config[]} */
export const domainRules = [
  ...DOMAINS.flatMap((domain) => [
    {
      files: [`${DOMAIN_DIR}/${domain}/**/*.ts`],
      rules: restrictImports([...siblingDomains(domain), storageEntrypointOnly, notRoutes]),
    },
    // Tests may use the shared test helpers from infrastructure.
    {
      files: [`${DOMAIN_DIR}/${domain}/**/__tests__/**/*.ts`],
      rules: restrictImports(siblingDomains(domain)),
    },
  ]),
  // domain/services.ts and any other file directly in domain/ may use every domain, through its index.ts.
  {
    files: [`${DOMAIN_DIR}/*.ts`],
    rules: restrictImports([
      ...DOMAINS.map((domain) => entrypointOnly(domain)),
      storageEntrypointOnly,
      notRoutes,
    ]),
  },
  {
    files: [`${BACKEND_DIR}/**/*.ts`],
    ignores: [`${DOMAIN_DIR}/**`],
    rules: restrictImports(DOMAINS.map((domain) => entrypointOnly(`domain/${domain}`))),
  },
];

// Frontend layout: components/ are generic and pure, pages/ are the route screens, features/<name>/
// holds the logic of one area (hooks, data access, state) and lib/<name>/ generic utilities such
// as the HTTP client. The skeleton (App, AppLayout, RequireAuth, queryClient, routes, scene layers)
// wires them. Features and libs are used only through their index.ts. Dependencies point one way:
// components import none of the rest, libs import no features or pages, features import no pages.
const FRONTEND_DIR = 'src/platform/frontend';
const FRONTEND_FEATURES = ['auth'];
const FRONTEND_LIBS = ['http'];

const SKELETON = [
  '**/App.tsx',
  '**/AppLayout.tsx',
  '**/RequireAuth.tsx',
  '**/queryClient.ts',
  '**/routes.ts',
  '**/sceneLayers.ts',
];

// Each group of files gets one complete list: a later no-restricted-imports setting for the same
// file replaces an earlier one instead of adding to it.
const publicEntrypointOnly = (kind, name) => ({
  group: [`**/${kind}/${name}/**`, `!**/${kind}/${name}/index.ts`],
  message: `Import ${kind}/${name} only through its index.ts.`,
});

const siblingEntrypointOnly = (names, name) =>
  names
    .filter((other) => other !== name)
    .map((other) => ({
      group: [`**/${other}/**`, `!**/${other}/index.ts`],
      message: `Import ${other} only through its index.ts.`,
    }));

const featureEntrypoints = FRONTEND_FEATURES.map((name) => publicEntrypointOnly('features', name));
const libEntrypoints = FRONTEND_LIBS.map((name) => publicEntrypointOnly('lib', name));
const inFrontend = (folder) => [`${FRONTEND_DIR}/${folder}/**/*.{ts,tsx}`];

/** @type {import('eslint').Linter.Config[]} */
export const frontendRules = [
  {
    files: inFrontend('**'),
    ignores: [...inFrontend('features'), ...inFrontend('lib'), ...inFrontend('components')],
    rules: restrictImports([...featureEntrypoints, ...libEntrypoints]),
  },
  ...FRONTEND_FEATURES.map((name) => ({
    files: inFrontend(`features/${name}`),
    rules: restrictImports([
      ...siblingEntrypointOnly(FRONTEND_FEATURES, name),
      ...libEntrypoints,
      { group: ['**/pages/**'], message: 'Features must not import pages.' },
    ]),
  })),
  ...FRONTEND_LIBS.map((name) => ({
    files: inFrontend(`lib/${name}`),
    rules: restrictImports([
      ...siblingEntrypointOnly(FRONTEND_LIBS, name),
      {
        group: ['**/features/**', '**/pages/**', ...SKELETON],
        message: 'Libs are generic: they must not import features, pages or the app skeleton.',
      },
    ]),
  })),
  {
    files: inFrontend('components'),
    rules: restrictImports([
      {
        group: ['**/pages/**', '**/features/**', '**/lib/**', ...SKELETON],
        message:
          'Components are generic and pure: they must not import pages, features, libs or the app skeleton.',
      },
    ]),
  },
];

// src/platform/shared/ holds what frontend and backend both need (today the HTTP status codes).
// It stands on its own, so both sides can import it without depending on each other.
/** @type {import('eslint').Linter.Config} */
export const sharedRules = {
  files: ['src/platform/shared/**/*.ts'],
  rules: restrictImports([
    {
      group: ['**/frontend/**', '**/backend/**', '**/modules/**', '#platform/*'],
      message: 'shared/ must not import frontend, backend or module code.',
    },
  ]),
};

// A returned object with several properties is written one property per line, as in
// `return { create, list }` spread over lines. This also covers an arrow function that returns an
// object directly (`=> ({ a, b })`). Prettier keeps an object expanded when its first property is
// on a new line, so the two tools agree.
const returnedObjectOnePerLine = {
  meta: {
    type: 'layout',
    schema: [],
    messages: {
      split:
        'Write a returned object with its first property on a new line and one property per line.',
    },
  },
  create(context) {
    const check = (object) => {
      if (object?.type !== 'ObjectExpression' || object.properties.length < 2) {
        return;
      }

      const lines = object.properties.map((property) => property.loc.start.line);

      if (new Set(lines).size !== lines.length) {
        context.report({ node: object, messageId: 'split' });
      }
    };

    return {
      ReturnStatement(node) {
        check(node.argument);
      },
      ArrowFunctionExpression(node) {
        check(node.body);
      },
    };
  },
};

// Functions are arrow functions. Methods of classes and objects stay methods, because they are
// part of a type's shape (and ESLint rules themselves are objects with a `create` method).
const notMethod =
  ":not(MethodDefinition, Property[method=true], Property[kind='get'], Property[kind='set'])";

// A statement spanning several lines (a block, a multi-line declaration or call) gets a blank line
// before and after it, so each step stands apart. One-line statements may stay grouped.
const MULTILINE_STATEMENTS = [
  'multiline-block-like',
  'multiline-const',
  'multiline-let',
  'multiline-expression',
];

/** @type {import('eslint').Linter.Config} */
export const styleRules = {
  plugins: {
    homedex: { rules: { 'returned-object-one-per-line': returnedObjectOnePerLine } },
    '@stylistic': stylistic,
  },
  rules: {
    'homedex/returned-object-one-per-line': 'error',
    '@stylistic/padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: MULTILINE_STATEMENTS, next: '*' },
      { blankLine: 'always', prev: '*', next: MULTILINE_STATEMENTS },
    ],
    curly: ['error', 'all'],
    'arrow-body-style': ['error', 'as-needed'],
    'func-style': ['error', 'expression'],
    'prefer-arrow-callback': 'error',
    'no-restricted-syntax': [
      'error',
      {
        selector: `${notMethod} > FunctionExpression`,
        message: 'Use an arrow function instead of a function expression.',
      },
    ],
  },
};

export default defineConfig(
  {
    ignores: [
      'dist/',
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'coverage/',
      'data/',
      'tests/boundaries/fixtures/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['*.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/platform/frontend/**/*.{ts,tsx}', 'src/modules/*/frontend/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  { ...jsxA11y.flatConfigs.recommended, files: ['**/*.tsx'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    ...boundaryRules,
  },
  ...domainRules,
  ...frontendRules,
  sharedRules,
  { files: ['*.js', '*.ts'], languageOptions: { globals: globals.node } },
  { files: ['*.js'], extends: [tseslint.configs.disableTypeChecked] },
  prettier,
  // After prettier, which turns `curly` off; with 'all' the two tools do not conflict.
  { files: ['**/*.{js,ts,tsx}'], ...styleRules },
);
