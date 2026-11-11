import { Button } from '../../components/button/Button.tsx';
import { Panel } from '../../components/panel/Panel.tsx';
import { Wordmark } from '../../components/wordmark/Wordmark.tsx';

export interface SessionUnavailablePageProps {
  onRetry: () => void;
}

export const SessionUnavailablePage = ({ onRetry }: SessionUnavailablePageProps) => (
  <Panel className="flex flex-col gap-3">
    <Wordmark />
    <h1 className="text-3xl font-extrabold">Can&apos;t reach HomeDex</h1>
    <p className="text-dex-ink-muted text-base">Check your connection and try again.</p>
    <Button className="self-start" onClick={onRetry}>
      Try again
    </Button>
  </Panel>
);
