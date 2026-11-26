import { useId } from 'react';
import type { ComponentProps } from 'react';

export interface TextAreaProps extends ComponentProps<'textarea'> {
  label: string;
  error?: string;
}

const FIELD_CLASSES =
  'border-dex-field-border text-dex-ink placeholder:text-dex-ink-muted focus-visible:outline-dex-ink aria-invalid:border-dex-red-text bg-dex-surface/95 min-h-24 resize-none rounded-3xl border px-5 py-3 text-base focus-visible:outline-3 focus-visible:outline-offset-2 aria-invalid:border-2';

export const TextArea = ({ label, error, id, ...rest }: TextAreaProps) => {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-dex-ink-muted px-5 text-sm font-bold">
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={FIELD_CLASSES}
        {...rest}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-dex-red-text px-5 text-sm font-bold">
          {error}
        </p>
      ) : null}
    </div>
  );
};
