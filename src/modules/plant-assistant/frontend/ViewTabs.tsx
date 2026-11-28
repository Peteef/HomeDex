import { NavLink } from 'react-router';
import { CountBadge } from './components/count-badge/CountBadge.tsx';
import { useText } from './locales/index.ts';
import { VIEW_PATHS, VIEWS } from './views.ts';
import type { View } from './views.ts';

const TAB_CLASSES =
  'focus-visible:outline-dex-ink -mb-px inline-flex min-h-11 items-center border-b-3 text-xl font-extrabold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2';

const CURRENT_TAB_CLASSES = 'border-dex-red text-dex-ink';
const OTHER_TAB_CLASSES = 'text-dex-ink-muted hover:text-dex-ink border-transparent';

const tabClasses = ({ isActive }: { isActive: boolean }): string =>
  `${TAB_CLASSES} ${isActive ? CURRENT_TAB_CLASSES : OTHER_TAB_CLASSES}`;

export interface ViewTabsProps {
  todayCount: number;
}

export const ViewTabs = ({ todayCount }: ViewTabsProps) => {
  const text = useText('layout.viewTabs');
  const layoutText = useText('layout');

  const tabContent =
    (view: View) =>
    ({ isActive }: { isActive: boolean }) => {
      const count = view === 'today' && !isActive ? todayCount : 0;

      return (
        <>
          {text[view]}
          {count > 0 && (
            <>
              <span className="ml-2">
                <CountBadge count={count} />
              </span>
              <span className="sr-only">{layoutText.toWater({ count })}</span>
            </>
          )}
        </>
      );
    };

  return (
    <nav aria-label={text.label}>
      <ul className="border-dex-line flex gap-6 border-b">
        {VIEWS.map((view) => (
          <li key={view}>
            <NavLink to={VIEW_PATHS[view]} end className={tabClasses}>
              {tabContent(view)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
