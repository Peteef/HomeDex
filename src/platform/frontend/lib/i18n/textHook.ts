import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { sectionOf, textOf } from './internal/textOf.ts';
import type { Translate } from './internal/textOf.ts';
import type { At, Messages, Namespace, Section, Text } from './types.ts';

export const SOURCE_LANGUAGE = 'en';

// Why not plain i18next? Calls like t('login.picker.title') repeat long key strings everywhere,
// and the IDE can't take you from one to its text. So useText hands you a section of the
// messages as an object: you write text.title, Cmd+click lands on the text, and forgetting a
// {{value}} breaks the build. i18next still does the real work underneath. The price is the clever
// types in types.ts; if they ever hurt more than they help, go back to useTranslation().
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
