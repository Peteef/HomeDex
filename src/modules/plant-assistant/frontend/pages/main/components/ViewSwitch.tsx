import { Link } from 'react-router';
import { useText } from '../../../locales/index.ts';
import { VIEW_PATHS } from '../internal/views.ts';

export type SideView = 'plants' | 'calendar';

export interface ViewSwitchProps {
  current: SideView;
}

const OPTIONS: SideView[] = ['plants', 'calendar'];

const OPTION_CLASSES =
  'focus-visible:outline-dex-ink inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2';

const CURRENT_OPTION_CLASSES = 'bg-dex-red-soft text-dex-red-text';
const OTHER_OPTION_CLASSES = 'text-dex-ink-muted hover:text-dex-ink';

export const ViewSwitch = ({ current }: ViewSwitchProps) => {
  const text = useText('main');

  return (
    <nav aria-label={text.rightColumn}>
      <ul className="bg-dex-surface/60 border-dex-line inline-flex gap-1 rounded-full border p-1">
        {OPTIONS.map((option) => (
          <li key={option}>
            <Link
              to={VIEW_PATHS[option]}
              aria-current={option === current ? 'page' : undefined}
              className={`${OPTION_CLASSES} ${option === current ? CURRENT_OPTION_CLASSES : OTHER_OPTION_CLASSES}`}
            >
              {text[option]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
