import { includeIf } from '../../../../shared/objects/includeIf.ts';
import { Button } from '../../../components/button/Button.tsx';
import { LoadingStatus } from '../../../components/loading-status/LoadingStatus.tsx';
import { AddTile } from '../../../components/tile/AddTile.tsx';
import { Tile } from '../../../components/tile/Tile.tsx';
import type { TileProps } from '../../../components/tile/Tile.tsx';
import { useText } from '../../../lib/i18n/index.ts';

export type TileEntry = Omit<TileProps, 'onTogglePin' | 'onEdit'> & {
  id: number;
  editable: boolean;
};

export interface TileListProps {
  entries: TileEntry[] | undefined;
  failed: boolean;
  query: string;
  onRetry: () => void;
  onTogglePin: (entry: TileEntry) => void;
  onEdit: (entry: TileEntry) => void;
  onAdd: () => void;
}

const MESSAGE_CLASSES = 'text-dex-ink-muted py-6 text-center text-base font-bold';

export const TileList = ({
  entries,
  failed,
  query,
  onRetry,
  onTogglePin,
  onEdit,
  onAdd,
}: TileListProps) => {
  const text = useText('home.tileList');
  const actions = useText('common.actions');

  if (failed) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-dex-red-text text-base font-bold">
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

  const searching = query !== '';

  if (searching && entries.length === 0) {
    return (
      <p role="status" className={MESSAGE_CLASSES}>
        {text.noMatches({ query })}
      </p>
    );
  }

  const showHoldHint = !searching && entries.some(({ editable }) => editable);

  const tile = (entry: TileEntry) => {
    const { id, editable, ...props } = entry;

    const editEntry = (): void => {
      onEdit(entry);
    };

    return (
      <Tile
        key={id}
        {...props}
        onTogglePin={() => {
          onTogglePin(entry);
        }}
        {...includeIf(editable, { onEdit: editEntry })}
      />
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {entries.length === 0 && (
        <p role="status" className={MESSAGE_CLASSES}>
          {text.empty}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {entries.map(tile)}
        {!searching && <AddTile onAdd={onAdd} />}
      </div>
      {showHoldHint && (
        <p className="text-dex-ink-muted can-hover:hidden text-center text-sm">{text.holdToEdit}</p>
      )}
    </div>
  );
};
