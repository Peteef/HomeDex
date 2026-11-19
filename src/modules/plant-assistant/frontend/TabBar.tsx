import { CalendarDays, Droplets, Sprout } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router';
import { useText } from './locales/index.ts';
import { VIEW_PATHS } from './views.ts';
import type { View } from './views.ts';

const TABS: { view: View; Icon: LucideIcon }[] = [
  { view: 'plants', Icon: Sprout },
  { view: 'today', Icon: Droplets },
  { view: 'calendar', Icon: CalendarDays },
];

const TAB_CLASSES =
  'focus-visible:outline-dex-ink flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2';

const CURRENT_TAB_CLASSES = 'bg-dex-red-soft text-dex-red-text';
const OTHER_TAB_CLASSES = 'text-dex-ink-muted hover:text-dex-ink';

const tabClasses = ({ isActive }: { isActive: boolean }): string =>
  `${TAB_CLASSES} ${isActive ? CURRENT_TAB_CLASSES : OTHER_TAB_CLASSES}`;

// The bar follows the whole page, footer included, in the document: it sticks to the bottom of
// the screen, and at the end of the page it sits below the footer instead of covering it.
export const TabBar = () => {
  const text = useText('layout.tabBar');

  return createPortal(
    <nav
      aria-label={text.label}
      className="bg-dex-glass border-dex-rim sticky bottom-0 z-10 border-t px-[max(0.75rem,env(safe-area-inset-right))] pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-md gap-2">
        {TABS.map(({ view, Icon }) => (
          <li key={view} className="flex-1">
            <NavLink to={VIEW_PATHS[view]} end className={tabClasses}>
              <Icon size={22} aria-hidden />
              {text[view]}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>,
    document.body,
  );
};
