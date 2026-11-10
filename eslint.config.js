import js from '@eslint/js';
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
const DOMAINS = ['accounts', 'auth'];

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
  { files: ['*.js', '*.ts'], languageOptions: { globals: globals.node } },
  { files: ['*.js'], extends: [tseslint.configs.disableTypeChecked] },
  prettier,
);
