import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Panel } from './components/panel/Panel.tsx';
import { useText } from './lib/i18n/index.ts';
import { HOME_PATH } from './routes.ts';

export interface ModulePageProps {
  title: string;
  wide?: boolean;
  children: ReactNode;
}

export const ModulePage = ({ title, wide = false, children }: ModulePageProps) => {
  const text = useText('common.actions');

  return (
    <Panel wide={wide} className="flex flex-col gap-4">
      <Link
        to={HOME_PATH}
        className="text-dex-ink-muted hover:text-dex-ink focus-visible:outline-dex-ink inline-flex min-h-11 items-center gap-2 self-start rounded-full text-sm font-bold focus-visible:outline-3 focus-visible:outline-offset-2"
      >
        <ArrowLeft size={18} aria-hidden />
        {text.backToDex}
      </Link>
      <h1 className="text-3xl font-extrabold">{title}</h1>
      {children}
    </Panel>
  );
};
