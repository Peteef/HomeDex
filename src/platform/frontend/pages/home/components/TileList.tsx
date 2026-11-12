import { Button } from '../../../components/button/Button.tsx';
import { LoadingStatus } from '../../../components/loading-status/LoadingStatus.tsx';
import { Tile } from '../../../components/tile/Tile.tsx';
import type { TileProps } from '../../../components/tile/Tile.tsx';
import { useText } from '../../../lib/i18n/index.ts';

export type TileEntry = Omit<TileProps, 'onTogglePin'> & { id: number };

export interface TileListProps {
  entries: TileEntry[] | undefined;
  failed: boolean;
  query: string;
  onRetry: () => void;
  onTogglePin: (entry: TileEntry) => void;
}

const MESSAGE_CLASSES = 'text-dex-ink-muted py-6 text-center text-base font-bold';

export const TileList = ({ entries, failed, query, onRetry, onTogglePin }: TileListProps) => {
  const text = useText('home.tileList');
  const actions = useText('common.actions');

  if (failed) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-dex-red-deep text-base font-bold">
          {text.loadFailed}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          {actions.tryAgain}
        </Button>
      </div>
    );
  }

  if (entries === undefined) {
    return <LoadingStatus />;
  }

  if (entries.length === 0) {
    return (
      <p role="status" className={MESSAGE_CLASSES}>
        {query === '' ? text.empty : text.noMatches({ query })}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {entries.map((entry) => (
        <Tile
          key={entry.id}
          {...entry}
          onTogglePin={() => {
            onTogglePin(entry);
          }}
        />
      ))}
    </div>
  );
};
