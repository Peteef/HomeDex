import { Button } from '../../components/button/Button.tsx';
import { Panel } from '../../components/panel/Panel.tsx';
import { Wordmark } from '../../components/wordmark/Wordmark.tsx';
import { useText } from '../../lib/i18n/index.ts';

export interface SessionUnavailablePageProps {
  onRetry: () => void;
}

export const SessionUnavailablePage = ({ onRetry }: SessionUnavailablePageProps) => {
  const text = useText('sessionUnavailable');
  const actions = useText('common.actions');
  return (
    <Panel className="flex flex-col gap-3">
      <Wordmark />
      <h1 className="text-3xl font-extrabold">{text.title}</h1>
      <p className="text-dex-ink-muted text-base">{text.message}</p>
      <Button className="self-start" onClick={onRetry}>
        {actions.tryAgain}
      </Button>
    </Panel>
  );
};
