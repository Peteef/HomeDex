import type { PLATFORM_NAMESPACE } from './i18n.ts';
import type en from './locales/en.json';

// English is the source language: a key missing from it fails the typecheck. A module adds its own
// namespace the same way (see src/modules/README.md).
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof PLATFORM_NAMESPACE;
  }

  interface ResourceNamespaceMap {
    [PLATFORM_NAMESPACE]: typeof en;
  }
}
