import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { sectionOf, textOf } from './internal/textOf.ts';
import type { Translate } from './internal/textOf.ts';
import type { At, Messages, Namespace, Section, Text } from './types.ts';

export const SOURCE_LANGUAGE = 'en';

// A thin layer over i18next, chosen over plain t('login.picker.title') calls (owner, PR #15 review):
// useText('login.picker') returns that section as an object, so code reads text.title, Cmd+click
// opens the message in locales/en.ts, and a missing {{value}} fails the typecheck. i18next still
// does the translating (language, fallback, plurals). If the types ever cost more than they give,
// replace useText with plain useTranslation() calls.
export const textHook = <NS extends Namespace>(namespace: NS) => {
  const useText = <Prefix extends Section<Messages<NS>> & string>(
    prefix: Prefix,
  ): Text<At<Messages<NS>, Prefix>> => {
    const { t, i18n } = useTranslation(namespace);

    return useMemo(() => {
      const source: unknown = i18n.getResourceBundle(SOURCE_LANGUAGE, namespace);
      // i18next types t() by literal keys; textOf builds the same keys at run time.
      return textOf(t as unknown as Translate, sectionOf(source, prefix), prefix);
    }, [t, i18n, prefix]) as Text<At<Messages<NS>, Prefix>>;
  };

  return useText;
};
