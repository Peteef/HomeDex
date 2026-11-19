import { NavLink } from 'react-router';
import { useText } from './locales/index.ts';
import { VIEW_PATHS, VIEWS } from './views.ts';

const TAB_CLASSES =
  'focus-visible:outline-dex-ink -mb-px inline-flex min-h-11 items-center border-b-3 text-xl font-extrabold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2';

const CURRENT_TAB_CLASSES = 'border-dex-red text-dex-ink';
const OTHER_TAB_CLASSES = 'text-dex-ink-muted hover:text-dex-ink border-transparent';

const tabClasses = ({ isActive }: { isActive: boolean }): string =>
  `${TAB_CLASSES} ${isActive ? CURRENT_TAB_CLASSES : OTHER_TAB_CLASSES}`;

export const ViewTabs = () => {
  const text = useText('layout.viewTabs');

  return (
    <nav aria-label={text.label}>
      <ul className="border-dex-line flex gap-6 border-b">
        {VIEWS.map((view) => (
          <li key={view}>
            <NavLink to={VIEW_PATHS[view]} end className={tabClasses}>
              {text[view]}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
