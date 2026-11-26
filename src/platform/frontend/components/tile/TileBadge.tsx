export interface TileBadgeProps {
  count: number;
}

const MAX_SHOWN = 99;

export const TileBadge = ({ count }: TileBadgeProps) => (
  <span
    aria-hidden
    className="bg-dex-red ring-dex-card absolute -top-1.5 -right-2.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs leading-none font-extrabold text-white ring-2"
  >
    {count > MAX_SHOWN ? `${String(MAX_SHOWN)}+` : count}
  </span>
);
