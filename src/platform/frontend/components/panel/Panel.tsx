import type { ComponentProps } from 'react';
import { classNames } from '../classNames.ts';

export interface PanelProps extends ComponentProps<'div'> {
  wide?: boolean;
}

export const Panel = ({ wide = false, className, ...rest }: PanelProps) => (
  <div
    className={classNames(
      'rounded-panel bg-dex-glass shadow-panel border-t-dex-red border-dex-rim w-full border border-t-6 p-4 backdrop-blur-md sm:p-6',
      wide ? 'max-w-6xl' : 'max-w-3xl',
      className,
    )}
    {...rest}
  />
);
