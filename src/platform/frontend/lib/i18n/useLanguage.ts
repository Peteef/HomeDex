import { useTranslation } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY, LANGUAGES, SOURCE_LANGUAGE } from './languages.ts';
import type { Language } from './languages.ts';

const rememberChoice = (language: Language) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage can be blocked (for example in a private window); the choice then lasts this visit.
  }
};

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find(({ code }) => code === i18n.resolvedLanguage);

  const change = (language: Language) => {
    rememberChoice(language);
    void i18n.changeLanguage(language);
  };

  return {
    language: current?.code ?? SOURCE_LANGUAGE,
    languages: LANGUAGES,
    change,
  };
};
