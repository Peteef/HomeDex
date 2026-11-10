import { createElement } from 'react';
import type { LucideProps } from 'lucide-react';
import { resolveIcon } from './iconRegistry.ts';

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

// createElement, not JSX: the registry returns stable module-level components, which the
// react-hooks "components created during render" rule cannot tell from a component made in render.
export const Icon = ({ name, ...rest }: IconProps) => createElement(resolveIcon(name), rest);
