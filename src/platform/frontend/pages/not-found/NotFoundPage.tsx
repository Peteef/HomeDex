import { Link } from 'react-router';
import { MessagePanel } from '../../components/message-panel/MessagePanel.tsx';
import { useText } from '../../lib/i18n/index.ts';
import { HOME_PATH } from '../../routes.ts';

const HOME_LINK_CLASSES =
  'text-dex-red-deep focus-visible:outline-dex-ink inline-flex min-h-11 items-center self-start font-bold underline focus-visible:outline-3 focus-visible:outline-offset-2';

export const NotFoundPage = () => {
  const text = useText('notFound');
  const actions = useText('common.actions');

  return (
    <MessagePanel title={text.title} message={text.message}>
      <Link to={HOME_PATH} className={HOME_LINK_CLASSES}>
        {actions.backToDex}
      </Link>
    </MessagePanel>
  );
};
