export const ICON_NAMES = [
  'link',
  'spreadsheet',
  'wallet',
  'home',
  'hammer',
  'receipt',
  'bank',
  'cart',
  'scale',
  'calendar',
  'health',
  'car',
  'plane',
  'book',
  'camera',
  'music',
  'notes',
  'food',
  'work',
  'star',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const isIconName = (name: string): name is IconName =>
  (ICON_NAMES as readonly string[]).includes(name);
