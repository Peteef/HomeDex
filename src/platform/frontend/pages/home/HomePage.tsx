import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser, useLogout } from '../../features/auth/index.ts';
import { IconButton } from '../../components/icon-button/IconButton.tsx';
import { Panel } from '../../components/panel/Panel.tsx';
import { TextInput } from '../../components/text-input/TextInput.tsx';
import { Tile } from '../../components/tile/Tile.tsx';
import { Wordmark } from '../../components/wordmark/Wordmark.tsx';
import { PLACEHOLDER_TILES } from './placeholderTiles.ts';
import { sortTiles } from './sortTiles.ts';

export const HomePage = () => {
  const { username } = useCurrentUser();
  const logout = useLogout();
  const [pinned, setPinned] = useState<ReadonlySet<number>>(new Set());

  const togglePin = (dexNo: number) => {
    setPinned((current) => {
      const next = new Set(current);
      if (!next.delete(dexNo)) {
        next.add(dexNo);
      }
      return next;
    });
  };

  const tiles = sortTiles(PLACEHOLDER_TILES, (tile) => pinned.has(tile.dexNo));

  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Wordmark />
        <IconButton
          icon={<LogOut size={20} />}
          label="Sign out"
          disabled={logout.isPending}
          onClick={() => {
            logout.mutate();
          }}
        />
      </div>
      <h1 className="text-3xl font-extrabold">Hello {username}! What do you need today?</h1>
      <TextInput label="Find a tile" hideLabel placeholder="Search the Dex..." type="search" />
      <h2 className="text-dex-ink-muted text-xs font-extrabold tracking-[0.2em] uppercase">
        All entries
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Tile
            key={tile.dexNo}
            {...tile}
            pinned={pinned.has(tile.dexNo)}
            onTogglePin={() => {
              togglePin(tile.dexNo);
            }}
          />
        ))}
      </div>
    </Panel>
  );
};
