import { Button } from '../../../components/button/Button.tsx';
import { AccountTiles } from './AccountTiles.tsx';

export interface AccountPickerProps {
  usernames: string[] | undefined;
  failed: boolean;
  onRetry: () => void;
  onPick: (username: string) => void;
}

export const AccountPicker = ({ usernames, failed, onRetry, onPick }: AccountPickerProps) => (
  <>
    <h1 className="text-3xl font-extrabold">Who&apos;s there, Trainer?</h1>
    {failed ? (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-dex-red-deep text-base font-bold">
          Can&apos;t load the Trainers.
        </p>
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </div>
    ) : usernames === undefined ? (
      <p role="status" className="sr-only">
        Loading…
      </p>
    ) : (
      <AccountTiles usernames={usernames} onPick={onPick} />
    )}
  </>
);
