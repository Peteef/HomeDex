import { textHook } from '#platform/frontend';
import type en from './en.ts';

declare module 'i18next' {
  interface ResourceNamespaceMap {
    'plant-assistant': typeof en;
  }
}

export const useText = textHook('plant-assistant');
