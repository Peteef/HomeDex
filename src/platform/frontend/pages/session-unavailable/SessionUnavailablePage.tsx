import { useTranslation } from 'react-i18next';
import { Button } from '../../components/button/Button.tsx';
import { Panel } from '../../components/panel/Panel.tsx';
import { Wordmark } from '../../components/wordmark/Wordmark.tsx';

export interface SessionUnavailablePageProps {
  onRetry: () => void;
}

export const SessionUnavailablePage = ({ onRetry }: SessionUnavailablePageProps) => {
  const { t } = useTranslation(['errors', 'common']);
  return (
    <Panel className="flex flex-col gap-3">
      <Wordmark />
      <h1 className="text-3xl font-extrabold">{t('sessionUnavailable.title')}</h1>
      <p className="text-dex-ink-muted text-base">{t('sessionUnavailable.message')}</p>
      <Button className="self-start" onClick={onRetry}>
        {t('common:actions.tryAgain')}
      </Button>
    </Panel>
  );
};
