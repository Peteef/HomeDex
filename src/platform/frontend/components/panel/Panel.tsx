import type { ComponentProps } from 'react';
import { classNames } from '../classNames.ts';

export const Panel = ({ className, ...rest }: ComponentProps<'div'>) => (
  <div
    className={classNames(
      'rounded-panel bg-dex-glass shadow-panel border-t-dex-red border-dex-rim w-full max-w-3xl border border-t-6 p-4 backdrop-blur-md sm:p-6',
      className,
    )}
    {...rest}
  />
);
