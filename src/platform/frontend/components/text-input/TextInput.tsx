import { useId } from 'react';
import type { ComponentProps } from 'react';
import { classNames } from '../classNames.ts';

export interface TextInputProps extends ComponentProps<'input'> {
  label: string;
  hideLabel?: boolean;
  error?: string;
}

export const TextInput = ({ label, hideLabel, error, id, className, ...rest }: TextInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className={classNames('text-dex-ink-muted text-sm font-bold', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={classNames(
          'border-dex-field-border text-dex-ink placeholder:text-dex-ink-muted focus-visible:outline-dex-ink aria-invalid:border-dex-red-deep min-h-11 rounded-full border bg-white/95 px-5 text-base focus-visible:outline-3 focus-visible:outline-offset-2 aria-invalid:border-2',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-dex-red-deep text-sm font-bold">
          {error}
        </p>
      ) : null}
    </div>
  );
};
