import type { ComponentProps } from 'react';
import { classNames } from '../classNames.ts';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-dex-red hover:bg-dex-red-deep text-white',
  secondary: 'border-dex-field-border text-dex-ink border bg-white/90 hover:bg-white',
};

export const Button = ({
  variant = 'primary',
  type = 'button',
  className,
  ...rest
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={classNames(
        'focus-visible:outline-dex-ink inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-base font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    />
  );
};
