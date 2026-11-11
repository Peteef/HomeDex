import { Pin } from 'lucide-react';
import { Link } from 'react-router';
import { IconButton } from '../icon-button/IconButton.tsx';
import { Icon } from '../icon/Icon.tsx';

export interface TileProps {
  dexNo: number;
  icon: string;
  title: string;
  description?: string;
  href: string;
  external?: boolean;
  pinned: boolean;
  onTogglePin: () => void;
}

const DEX_NUMBER_DIGITS = 3;

export const formatDexNo = (dexNo: number): string =>
  `No. ${String(dexNo).padStart(DEX_NUMBER_DIGITS, '0')}`;

const LINK_CLASSES =
  'focus-visible:outline-dex-ink flex h-full flex-col gap-1 rounded-2xl p-3 focus-visible:outline-3 focus-visible:outline-offset-2';

export const Tile = ({
  dexNo,
  icon,
  title,
  description,
  href,
  external = false,
  pinned,
  onTogglePin,
}: TileProps) => {
  const content = (
    <>
      <span className="bg-dex-red mb-1 flex size-11 items-center justify-center rounded-full text-white">
        <Icon name={icon} size={22} />
      </span>
      <span className="text-dex-ink-muted text-xs font-bold">{formatDexNo(dexNo)}</span>
      <span className="text-dex-ink text-base leading-tight font-extrabold">{title}</span>
      {description ? (
        <span className="text-dex-ink-muted line-clamp-2 text-sm">{description}</span>
      ) : null}
    </>
  );

  return (
    <article className="border-dex-line bg-dex-card relative rounded-2xl border">
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASSES}>
          {content}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <Link to={href} className={LINK_CLASSES}>
          {content}
        </Link>
      )}
      <IconButton
        className="absolute top-1 right-1"
        icon={<Pin size={20} />}
        label={`Pin ${title}`}
        pressed={pinned}
        onClick={onTogglePin}
      />
    </article>
  );
};
