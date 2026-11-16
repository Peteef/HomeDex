import { Link } from 'react-router';
import type { ReactNode } from 'react';

export interface HomeLinkProps {
  to: string;
  children: ReactNode;
}

export const HomeLink = ({ to, children }: HomeLinkProps) => (
  <Link
    to={to}
    className="text-dex-red-deep focus-visible:outline-dex-ink inline-flex min-h-11 items-center self-start font-bold underline focus-visible:outline-3 focus-visible:outline-offset-2"
  >
    {children}
  </Link>
);
