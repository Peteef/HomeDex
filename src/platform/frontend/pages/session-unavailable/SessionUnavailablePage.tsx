import { Button } from '../../components/button/Button.tsx';
import { MessagePanel } from '../../components/message-panel/MessagePanel.tsx';
import { useText } from '../../lib/i18n/index.ts';

export interface SessionUnavailablePageProps {
  onRetry: () => void;
}

export const SessionUnavailablePage = ({ onRetry }: SessionUnavailablePageProps) => {
  const text = useText('sessionUnavailable');
  const actions = useText('common.actions');
  return (
    <MessagePanel title={text.title} message={text.message}>
      <Button className="self-start" onClick={onRetry}>
        {actions.tryAgain}
      </Button>
    </MessagePanel>
  );
};
