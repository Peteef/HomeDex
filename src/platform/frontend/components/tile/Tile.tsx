import { Pencil, Pin } from 'lucide-react';
import { Link } from 'react-router';
import { useText } from '../../lib/i18n/index.ts';
import { IconButton } from '../icon-button/IconButton.tsx';
import { Icon } from '../icon/Icon.tsx';
import { useLongPress } from './useLongPress.ts';

export interface TileProps {
  dexNo: number;
  icon: string;
  title: string;
  description?: string;
  href: string;
  external?: boolean;
  pinned: boolean;
  onTogglePin: () => void;
  onEdit?: () => void;
}

const DEX_NUMBER_DIGITS = 3;

const padDexNo = (dexNo: number): string => String(dexNo).padStart(DEX_NUMBER_DIGITS, '0');

const LINK_CLASSES =
  'focus-visible:outline-dex-ink flex h-full flex-col gap-1 rounded-2xl p-3 focus-visible:outline-3 focus-visible:outline-offset-2';

// A long press edits on touch screens, so iOS must not show its link preview or select text.
const HOLDABLE_LINK_CLASSES = `${LINK_CLASSES} select-none [-webkit-touch-callout:none]`;

// While a touch is held the tile sinks and a red ring fills in over the hold (motion only when
// allowed; the ring alone otherwise), then it pops when the editor opens.
const PRESS_CLASSES =
  'transition-[scale,box-shadow] duration-150 data-[press=holding]:ring-dex-red data-[press=holding]:ring-3 data-[press=holding]:duration-500 data-[press=holding]:motion-safe:scale-97 data-[press=held]:motion-safe:animate-pop';

// Shown on hover or keyboard focus with a mouse; on touch screens it stays for screen readers only.
const EDIT_BUTTON_CLASSES =
  'no-hover:sr-only can-hover:absolute can-hover:top-1 can-hover:right-13 can-hover:opacity-0 can-hover:group-focus-within:opacity-100 can-hover:group-hover:opacity-100';

export const Tile = ({
  dexNo,
  icon,
  title,
  description,
  href,
  external = false,
  pinned,
  onTogglePin,
  onEdit,
}: TileProps) => {
  const text = useText('components.tile');
  const { phase, handlers } = useLongPress(onEdit);
  const linkClasses = onEdit ? HOLDABLE_LINK_CLASSES : LINK_CLASSES;

  const content = (
    <>
      <span className="bg-dex-red mb-1 flex size-11 items-center justify-center rounded-full text-white">
        <Icon name={icon} size={22} />
      </span>
      <span className="text-dex-ink-muted text-xs font-bold">
        {text.dexNumber({ number: padDexNo(dexNo) })}
      </span>
      <span className="text-dex-ink text-base leading-tight font-extrabold">{title}</span>
      {description ? (
        <span className="text-dex-ink-muted line-clamp-2 text-sm">{description}</span>
      ) : null}
    </>
  );

  return (
    <article
      data-press={phase}
      className={`group border-dex-line bg-dex-card relative rounded-2xl border ${PRESS_CLASSES}`}
    >
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClasses}
          {...handlers}
        >
          {content}
          <span className="sr-only"> {text.opensInNewTab}</span>
        </a>
      ) : (
        <Link to={href} className={linkClasses} {...handlers}>
          {content}
        </Link>
      )}
      <IconButton
        className="absolute top-1 right-1"
        icon={<Pin size={20} />}
        label={text.pin({ title })}
        pressed={pinned}
        onClick={onTogglePin}
      />
      {onEdit ? (
        <IconButton
          className={EDIT_BUTTON_CLASSES}
          icon={<Pencil size={20} />}
          label={text.edit({ title })}
          onClick={onEdit}
        />
      ) : null}
    </article>
  );
};
