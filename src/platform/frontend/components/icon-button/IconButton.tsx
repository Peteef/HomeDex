import type { ComponentProps, ReactNode } from 'react';
import { classNames } from '../classNames.ts';

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  icon: ReactNode;
  label: string;
  pressed?: boolean;
}

export const IconButton = ({
  icon,
  label,
  pressed,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) => (
  <button
    type={type}
    aria-label={label}
    aria-pressed={pressed}
    className={classNames(
      'focus-visible:outline-dex-ink border-dex-line inline-flex size-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
      pressed ? 'bg-dex-red border-dex-red text-white' : 'text-dex-ink bg-white/90 hover:bg-white',
      className,
    )}
    {...rest}
  >
    {icon}
  </button>
);
