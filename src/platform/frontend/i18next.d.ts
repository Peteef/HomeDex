import type { PLATFORM_NAMESPACE } from './lib/i18n/index.ts';
import type en from './locales/en.ts';

// Gives i18next the English messages as types, which useText and <Trans> are typed from. A module
// registers its namespace the same way (see src/modules/README.md).
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof PLATFORM_NAMESPACE;
  }

  interface ResourceNamespaceMap {
    [PLATFORM_NAMESPACE]: typeof en;
  }
}
