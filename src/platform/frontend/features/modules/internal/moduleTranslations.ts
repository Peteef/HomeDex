import type { ResourceKey } from 'i18next';
import type { ModuleManifest } from '../../../../shared/manifest/manifestSchema.ts';
import type { ModuleTranslation } from '../types.ts';

const MODULES_ROOT = '/src/modules';
const LOCALES_DIR = 'frontend/locales';
const LOCALE_FILE = /^(?<language>[\w-]+)\.json$/;

const localesDirOf = (id: string): string => `${MODULES_ROOT}/${id}/${LOCALES_DIR}/`;

const languageOf = (fileName: string): string | undefined =>
  LOCALE_FILE.exec(fileName)?.groups?.language;

const translationsOf = (
  manifest: ModuleManifest,
  files: Record<string, ResourceKey>,
): ModuleTranslation[] => {
  const prefix = localesDirOf(manifest.id);
  return Object.entries(files).flatMap(([path, messages]) => {
    const language = path.startsWith(prefix) ? languageOf(path.slice(prefix.length)) : undefined;
    return language ? [{ namespace: manifest.id, language, messages }] : [];
  });
};

// Matches the manifests to their locale files, keyed by file path as import.meta.glob returns them.
// Each module's strings live in its own namespace, named after its id.
export const moduleTranslations = (
  manifests: Record<string, ModuleManifest>,
  files: Record<string, ResourceKey>,
): ModuleTranslation[] =>
  Object.values(manifests)
    .filter((manifest) => manifest.enabled)
    .flatMap((manifest) => translationsOf(manifest, files));
