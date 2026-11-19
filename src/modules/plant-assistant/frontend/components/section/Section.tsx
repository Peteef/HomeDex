import { useId } from 'react';
import type { ReactNode } from 'react';

export interface SectionProps {
  heading: string;
  children?: ReactNode;
}

// From lg the view tabs name the page, so the heading stays for screen readers only.
const HEADING_CLASSES =
  'border-dex-line flex min-h-11 items-center border-b text-xl font-extrabold lg:sr-only';

export const Section = ({ heading, children }: SectionProps) => {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className={HEADING_CLASSES}>
        {heading}
      </h2>
      {children}
    </section>
  );
};
