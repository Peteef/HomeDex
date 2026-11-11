import { textHook } from './textHook.ts';

export { SOURCE_LANGUAGE, textHook } from './textHook.ts';
export type { Text, Values } from './types.ts';

// Module ids may not be 'platform', so the platform's text never clashes with a module's.
export const PLATFORM_NAMESPACE = 'platform';

export const useText = textHook(PLATFORM_NAMESPACE);
