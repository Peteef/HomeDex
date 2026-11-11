import type { ResourceKey } from 'i18next';
import { MODULE_TRANSLATIONS } from '../../modules/index.ts';
import type { ModuleTranslation } from '../../modules/index.ts';
import { isLanguage } from '../../../lib/i18n/index.ts';
import type { TileText, TileTexts } from '../types.ts';

interface ManifestMessages {
  manifest?: {
    name?: unknown;
    description?: unknown;
  };
}

// A module's tile shows `manifest.name` and `manifest.description` of its locale files.
const tileTextOf = (messages: ResourceKey): TileText | undefined => {
  const { manifest } = messages as ManifestMessages;

  if (typeof manifest?.name !== 'string') {
    return undefined;
  }

  return {
    title: manifest.name,
    description: typeof manifest.description === 'string' ? manifest.description : null,
  };
};

const byModule = (translations: ModuleTranslation[]): Record<string, TileTexts> => {
  const texts: Record<string, TileTexts> = {};

  for (const { namespace, language, messages } of translations) {
    const text = tileTextOf(messages);

    if (text && isLanguage(language)) {
      texts[namespace] = { ...texts[namespace], [language]: text };
    }
  }

  return texts;
};

export const MODULE_TILE_TEXTS = byModule(MODULE_TRANSLATIONS);
