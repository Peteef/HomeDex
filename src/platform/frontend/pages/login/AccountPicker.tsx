import { Avatar } from '../../components/avatar/Avatar.tsx';
import { Button } from '../../components/button/Button.tsx';

export interface AccountPickerProps {
  usernames: string[] | undefined;
  failed: boolean;
  onRetry: () => void;
  onPick: (username: string) => void;
}

const TILE_CLASSES =
  'border-dex-line bg-dex-card hover:bg-white focus-visible:outline-dex-ink flex w-full flex-col items-center gap-2 rounded-2xl border p-4 transition-colors focus-visible:outline-3 focus-visible:outline-offset-2';

const AccountTiles = ({
  usernames,
  onPick,
}: {
  usernames: string[];
  onPick: (username: string) => void;
}) =>
  usernames.length === 0 ? (
    <p className="text-dex-ink-muted text-base">
      No Trainers yet. Create an account with <code>npm run users -- create</code>.
    </p>
  ) : (
    <ul className="flex flex-wrap justify-center gap-3">
      {usernames.map((username) => (
        <li key={username} className="w-36">
          <button
            type="button"
            className={TILE_CLASSES}
            onClick={() => {
              onPick(username);
            }}
          >
            <Avatar name={username} size="lg" />
            <span className="text-dex-ink w-full text-base leading-tight font-extrabold break-words">
              {username}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

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
