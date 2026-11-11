import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/button/Button.tsx';
import { LoadingStatus } from '../../../components/loading-status/LoadingStatus.tsx';
import { AccountTiles } from './AccountTiles.tsx';

export interface AccountPickerProps {
  usernames: string[] | undefined;
  failed: boolean;
  onRetry: () => void;
  onPick: (username: string) => void;
}

export const AccountPicker = ({ usernames, failed, onRetry, onPick }: AccountPickerProps) => {
  const { t } = useTranslation();
  return (
    <>
      <h1 className="text-3xl font-extrabold">{t('login.picker.title')}</h1>
      {failed ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-dex-red-deep text-base font-bold">
            {t('login.picker.loadFailed')}
          </p>
          <Button variant="secondary" onClick={onRetry}>
            {t('common.actions.tryAgain')}
          </Button>
        </div>
      ) : usernames === undefined ? (
        <LoadingStatus />
      ) : (
        <AccountTiles usernames={usernames} onPick={onPick} />
      )}
    </>
  );
};
