import { textHook } from '#platform/frontend';
import type en from './en.ts';

declare module 'i18next' {
  interface ResourceNamespaceMap {
    'shopping-list': typeof en;
  }
}

export const useText = textHook('shopping-list');
