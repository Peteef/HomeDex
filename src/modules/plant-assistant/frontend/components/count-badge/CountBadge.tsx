export interface CountBadgeProps {
  count: number;
}

// Only the eye needs the number here: the labelled element says it in words.
export const CountBadge = ({ count }: CountBadgeProps) =>
  count > 0 ? (
    <span
      aria-hidden
      className="bg-dex-red inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs leading-none font-extrabold text-white"
    >
      {count}
    </span>
  ) : null;
