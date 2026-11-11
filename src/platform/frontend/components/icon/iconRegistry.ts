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
import { isIconName } from '../../../shared/icons/iconNames.ts';
import type { IconName } from '../../../shared/icons/iconNames.ts';

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
} as const satisfies Record<IconName, LucideIcon>;

export const FALLBACK_ICON: LucideIcon = CircleHelp;

export const resolveIcon = (name: string): LucideIcon =>
  isIconName(name) ? ICONS[name] : FALLBACK_ICON;
