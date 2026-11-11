import { Trans } from 'react-i18next';
import { Avatar } from '../../../components/avatar/Avatar.tsx';

export interface AccountTilesProps {
  usernames: string[];
  onPick: (username: string) => void;
}

const CREATE_ACCOUNT_COMMAND = 'npm run users -- create';

const TILE_CLASSES =
  'border-dex-line bg-dex-card hover:bg-white focus-visible:outline-dex-ink flex w-full flex-col items-center gap-2 rounded-2xl border p-4 transition-colors focus-visible:outline-3 focus-visible:outline-offset-2';

export const AccountTiles = ({ usernames, onPick }: AccountTilesProps) =>
  usernames.length === 0 ? (
    <p className="text-dex-ink-muted text-base">
      <Trans
        ns="login"
        i18nKey="picker.empty"
        values={{ command: CREATE_ACCOUNT_COMMAND }}
        components={{ code: <code /> }}
      />
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
            <Avatar name={username} />
            <span className="text-dex-ink w-full text-base leading-tight font-extrabold break-words">
              {username}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
