// Public API of the platform frontend: the only thing modules may import (as #platform/frontend).
export { Button } from '../components/button/Button.tsx';
export type { ButtonProps, ButtonVariant } from '../components/button/Button.tsx';
export { IconButton } from '../components/icon-button/IconButton.tsx';
export type { IconButtonProps } from '../components/icon-button/IconButton.tsx';
export { Panel } from '../components/panel/Panel.tsx';
export { TextInput } from '../components/text-input/TextInput.tsx';
export type { TextInputProps } from '../components/text-input/TextInput.tsx';
export { Icon } from '../components/icon/Icon.tsx';
export type { IconProps } from '../components/icon/Icon.tsx';
export { ICON_NAMES } from '../../shared/icons/iconNames.ts';
export type { IconName } from '../../shared/icons/iconNames.ts';
export { textHook } from '../lib/i18n/index.ts';
export type { Translation } from '../lib/i18n/index.ts';
export { useCurrentUser } from '../features/auth/index.ts';
export type { CurrentUser } from '../features/auth/index.ts';
