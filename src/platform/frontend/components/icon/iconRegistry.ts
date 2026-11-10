import {
  BookOpen,
  Briefcase,
  Calendar,
  Camera,
  Car,
  CircleHelp,
  FileSpreadsheet,
  Hammer,
  HeartPulse,
  House,
  Landmark,
  Link,
  Music,
  NotebookPen,
  Plane,
  Receipt,
  Scale,
  ShoppingCart,
  Star,
  Utensils,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICONS = {
  link: Link,
  spreadsheet: FileSpreadsheet,
  wallet: Wallet,
  home: House,
  hammer: Hammer,
  receipt: Receipt,
  bank: Landmark,
  cart: ShoppingCart,
  scale: Scale,
  calendar: Calendar,
  health: HeartPulse,
  car: Car,
  plane: Plane,
  book: BookOpen,
  camera: Camera,
  music: Music,
  notes: NotebookPen,
  food: Utensils,
  work: Briefcase,
  star: Star,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

export const FALLBACK_ICON: LucideIcon = CircleHelp;

const isIconName = (name: string): name is IconName => {
  return Object.hasOwn(ICONS, name);
};

export const resolveIcon = (name: string): LucideIcon => {
  return isIconName(name) ? ICONS[name] : FALLBACK_ICON;
};
