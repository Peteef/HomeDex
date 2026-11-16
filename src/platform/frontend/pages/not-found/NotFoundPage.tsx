import { HomeLink } from '../../components/home-link/HomeLink.tsx';
import { MessagePanel } from '../../components/message-panel/MessagePanel.tsx';
import { useText } from '../../lib/i18n/index.ts';
import { HOME_PATH } from '../../routes.ts';

export const NotFoundPage = () => {
  const text = useText('notFound');
  const actions = useText('common.actions');

  return (
    <MessagePanel title={text.title} message={text.message}>
      <HomeLink to={HOME_PATH}>{actions.backToDex}</HomeLink>
    </MessagePanel>
  );
};
