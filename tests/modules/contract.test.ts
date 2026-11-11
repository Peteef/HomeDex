import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { manifestSchema } from '../../src/platform/shared/manifest/manifestSchema.ts';

// The module contract (src/modules/README.md), checked for every module in the repository. The
// server checks manifests again at startup; this catches the rest before a module is merged.
const MODULES_DIR = path.resolve(import.meta.dirname, '../../src/modules');
const FIXTURES_DIR = path.join(import.meta.dirname, 'fixtures');
const ENTRY_FILES = ['manifest.ts', 'frontend/index.tsx'];
const MIGRATIONS_DIR = 'backend/migrations';
const CREATE_TABLE = /create\s+table\s+(?:if\s+not\s+exists\s+)?["`[]?(\w+)/gi;

const moduleFolders = (modulesDir: string): string[] =>
  fs.existsSync(modulesDir)
    ? fs
        .readdirSync(modulesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];

const missingEntryFiles = (moduleDir: string): string[] =>
  ENTRY_FILES.filter((file) => !fs.existsSync(path.join(moduleDir, file))).map(
    (file) => `missing ${file}`,
  );

const manifestProblems = async (moduleDir: string, folder: string): Promise<string[]> => {
  const file = path.join(moduleDir, 'manifest.ts');

  if (!fs.existsSync(file)) {
    return [];
  }

  const { default: manifest } = (await import(pathToFileURL(file).href)) as { default: unknown };
  const result = manifestSchema.safeParse(manifest);

  if (!result.success) {
    return result.error.issues.map((issue) => `manifest ${issue.path.join('.')}: ${issue.message}`);
  }

  return result.data.id === folder ? [] : [`id "${result.data.id}" differs from the folder`];
};

const tablesCreatedIn = (file: string): string[] =>
  [...fs.readFileSync(file, 'utf8').matchAll(CREATE_TABLE)].map(([, table]) => table ?? '');

const tableProblems = (moduleDir: string, folder: string): string[] => {
  const migrationsDir = path.join(moduleDir, MIGRATIONS_DIR);
  const prefix = `${folder.replaceAll('-', '_')}_`;

  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs.readdirSync(migrationsDir).flatMap((file) =>
    tablesCreatedIn(path.join(migrationsDir, file))
      .filter((table) => !table.startsWith(prefix))
      .map((table) => `table ${table} in ${file} does not start with ${prefix}`),
  );
};

const contractProblems = async (modulesDir: string, folder: string): Promise<string[]> => {
  const moduleDir = path.join(modulesDir, folder);

  return [
    ...missingEntryFiles(moduleDir),
    ...(await manifestProblems(moduleDir, folder)),
    ...tableProblems(moduleDir, folder),
  ];
};

describe('module contract', () => {
  it.each(moduleFolders(MODULES_DIR))('should hold for src/modules/%s', async (folder) => {
    // When / Then
    expect(await contractProblems(MODULES_DIR, folder)).toEqual([]);
  });

  it('should hold for a module that follows it', async () => {
    // When / Then
    expect(await contractProblems(path.join(FIXTURES_DIR, 'good'), 'book-shelf')).toEqual([]);
  });

  it('should list every way a module breaks it', async () => {
    // When
    const problems = await contractProblems(path.join(FIXTURES_DIR, 'bad'), 'book-shelf');

    // Then
    expect(problems).toEqual([
      'missing frontend/index.tsx',
      'id "shelf" differs from the folder',
      'table books in 001_books.sql does not start with book_shelf_',
      'table shelf_notes in 001_books.sql does not start with book_shelf_',
    ]);
  });

  it('should require a manifest', async () => {
    // When / Then
    expect(await contractProblems(path.join(FIXTURES_DIR, 'bad'), 'no-manifest')).toEqual([
      'missing manifest.ts',
    ]);
  });
});
