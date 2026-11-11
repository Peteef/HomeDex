import { Button } from '../../../components/button/Button.tsx';
import { LoadingStatus } from '../../../components/loading-status/LoadingStatus.tsx';
import { useText } from '../../../lib/i18n/index.ts';
import { AccountTiles } from './AccountTiles.tsx';

export interface AccountPickerProps {
  usernames: string[] | undefined;
  failed: boolean;
  onRetry: () => void;
  onPick: (username: string) => void;
}

export const AccountPicker = ({ usernames, failed, onRetry, onPick }: AccountPickerProps) => {
  const text = useText('login.picker');
  const actions = useText('common.actions');
  return (
    <>
      <h1 className="text-3xl font-extrabold">{text.title}</h1>
      {failed ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-dex-red-deep text-base font-bold">
            {text.loadFailed}
          </p>
          <Button variant="secondary" onClick={onRetry}>
            {actions.tryAgain}
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
