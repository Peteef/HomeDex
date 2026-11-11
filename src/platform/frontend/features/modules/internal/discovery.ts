import type { ModuleManifest } from '../../../../shared/manifest/manifestSchema.ts';
import { modulePages } from './modulePages.ts';
import type { PageLoader } from './modulePages.ts';

// Vite resolves these globs at build time, so the patterns must be literal strings. This is how
// the platform finds modules without importing any of them by name.
const manifests = import.meta.glob<ModuleManifest>('/src/modules/*/manifest.ts', {
  eager: true,
  import: 'default',
});

const entries = import.meta.glob<Awaited<ReturnType<PageLoader>>>(
  '/src/modules/*/frontend/index.tsx',
);

export const MODULE_PAGES = modulePages(manifests, entries);
