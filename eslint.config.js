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
  { files: ['*.js', '*.ts'], languageOptions: { globals: globals.node } },
  { files: ['*.js'], extends: [tseslint.configs.disableTypeChecked] },
  prettier,
);
