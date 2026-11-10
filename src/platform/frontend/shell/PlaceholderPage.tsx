import { Link } from 'react-router';
import { Panel } from '../ui/Panel.tsx';
import { Wordmark } from './Wordmark.tsx';
import { HOME_PATH } from './routes.ts';

export interface PlaceholderPageProps {
  title: string;
  message: string;
  homeLink?: boolean;
}

export const PlaceholderPage = ({ title, message, homeLink = false }: PlaceholderPageProps) => {
  return (
    <Panel className="flex flex-col gap-3">
      <Wordmark />
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="text-dex-ink-muted text-base">{message}</p>
      {homeLink ? (
        <Link
          to={HOME_PATH}
          className="text-dex-red-deep focus-visible:outline-dex-ink inline-flex min-h-11 items-center self-start font-bold underline focus-visible:outline-3 focus-visible:outline-offset-2"
        >
          Back to the Dex
        </Link>
      ) : null}
    </Panel>
  );
};
