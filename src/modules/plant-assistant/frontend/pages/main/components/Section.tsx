import { useId } from 'react';
import type { ReactNode } from 'react';

export interface SectionProps {
  heading: string;
  hideHeading?: boolean;
  children?: ReactNode;
}

const HEADING_CLASSES =
  'border-dex-line flex min-h-11 items-center border-b text-xl font-extrabold';

export const Section = ({ heading, hideHeading = false, children }: SectionProps) => {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className={hideHeading ? 'sr-only' : HEADING_CLASSES}>
        {heading}
      </h2>
      {children}
    </section>
  );
};
