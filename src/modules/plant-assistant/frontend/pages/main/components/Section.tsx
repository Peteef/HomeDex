import { useId } from 'react';
import type { ReactNode } from 'react';

export interface SectionProps {
  heading: string;
  children?: ReactNode;
}

export const Section = ({ heading, children }: SectionProps) => {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-xl font-extrabold">
        {heading}
      </h2>
      {children}
    </section>
  );
};
