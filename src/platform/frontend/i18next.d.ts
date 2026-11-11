import type { DEFAULT_NAMESPACE } from './i18n.ts';
import type common from './locales/en/common.json';
import type errors from './locales/en/errors.json';
import type home from './locales/en/home.json';
import type login from './locales/en/login.json';

// English is the source language: a key missing from it fails the typecheck. A module adds its own
// namespace the same way (see src/modules/README.md).
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof DEFAULT_NAMESPACE;
  }

  interface ResourceNamespaceMap {
    common: typeof common;
    errors: typeof errors;
    home: typeof home;
    login: typeof login;
  }
}
