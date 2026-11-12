import type { IconName } from '../../../shared/icons/iconNames.ts';
import type { TileScope } from '../../features/tiles/index.ts';
import type { Language } from '../../lib/i18n/index.ts';

export interface LanguageText {
  language: Language;
  title: string;
  description: string;
}

export interface TileFormValues {
  texts: LanguageText[];
  url: string;
  icon: IconName;
  scope: TileScope;
}

export type TitleError = 'titleRequired';
export type UrlError = 'urlRequired' | 'urlInvalid';

export interface TileFormErrors {
  titles: Partial<Record<Language, TitleError>>;
  url?: UrlError;
}

export type SaveFailure = 'saveFailed' | 'deleteFailed' | 'gone';
