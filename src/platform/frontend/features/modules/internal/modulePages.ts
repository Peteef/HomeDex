import { lazy } from 'react';
import type { ComponentType } from 'react';
import type { ModuleManifest } from '../../../../shared/manifest/manifestSchema.ts';
import type { ModulePage } from '../types.ts';

export type PageLoader = () => Promise<{ default: ComponentType }>;

const MODULES_ROOT = '/src/modules';
const FRONTEND_ENTRY = 'frontend/index.tsx';

const entryOf = (id: string): string => `${MODULES_ROOT}/${id}/${FRONTEND_ENTRY}`;

const toModulePage = (manifest: ModuleManifest, loader: PageLoader): ModulePage => ({
  id: manifest.id,
  route: manifest.route,
  Page: lazy(loader),
});

// Matches the manifests to their page entries, keyed by file path as import.meta.glob returns them.
export const modulePages = (
  manifests: Record<string, ModuleManifest>,
  entries: Record<string, PageLoader>,
): ModulePage[] =>
  Object.values(manifests)
    .filter((manifest) => manifest.enabled)
    .flatMap((manifest) => {
      const loader = entries[entryOf(manifest.id)];
      return loader ? [toModulePage(manifest, loader)] : [];
    });
