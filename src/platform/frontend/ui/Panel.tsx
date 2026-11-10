import type { ComponentProps } from 'react';
import { classNames } from './classNames.ts';

export const Panel = ({ className, ...rest }: ComponentProps<'div'>) => {
  return (
    <div
      className={classNames(
        'rounded-panel bg-dex-glass shadow-panel border-t-dex-red w-full max-w-3xl border border-t-6 border-white/75 p-4 backdrop-blur-md sm:p-6',
        className,
      )}
      {...rest}
    />
  );
};
