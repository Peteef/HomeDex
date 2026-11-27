import { Button } from '../../components/button/Button.tsx';
import { TextLink } from '../../components/text-link/TextLink.tsx';
import { MessagePanel } from '../../components/message-panel/MessagePanel.tsx';
import { useText } from '../../lib/i18n/index.ts';
import { HOME_PATH } from '../../routes.ts';

export interface CrashedPageProps {
  scope: 'module' | 'app';
  onReload: () => void;
}

// The app-level screen is drawn outside the router, so only the module one links home.
export const CrashedPage = ({ scope, onReload }: CrashedPageProps) => {
  const text = useText('crashed');
  const actions = useText('common.actions');

  return (
    <MessagePanel title={text[scope].title} message={text[scope].message}>
      <Button className="self-start" onClick={onReload}>
        {text.reload}
      </Button>
      {scope === 'module' && <TextLink to={HOME_PATH}>{actions.backToDex}</TextLink>}
    </MessagePanel>
  );
};
