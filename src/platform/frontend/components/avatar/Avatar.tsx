import { classNames } from '../classNames.ts';

export interface AvatarProps {
  name: string;
}

// Full class names, so Tailwind finds them in the source.
const COLOURS = [
  'bg-avatar-red',
  'bg-avatar-blue',
  'bg-avatar-green',
  'bg-avatar-purple',
  'bg-avatar-orange',
  'bg-avatar-teal',
];

const FALLBACK_INITIAL = '?';
const HASH_MULTIPLIER = 31;

const colourOf = (name: string): string => {
  const lower = name.toLowerCase();
  let hash = 0;

  for (let index = 0; index < lower.length; index++) {
    hash = (hash * HASH_MULTIPLIER + lower.charCodeAt(index)) % COLOURS.length;
  }

  return COLOURS[hash] ?? '';
};

const firstGrapheme = (text: string): string | undefined => {
  const [first] = new Intl.Segmenter().segment(text);
  return first?.segment;
};

const initialOf = (name: string): string =>
  (firstGrapheme(name.trim()) ?? FALLBACK_INITIAL).toLocaleUpperCase();

export const Avatar = ({ name }: AvatarProps) => (
  <span
    aria-hidden="true"
    className={classNames(
      'flex size-16 shrink-0 items-center justify-center rounded-full text-3xl font-extrabold text-white',
      colourOf(name),
    )}
  >
    {initialOf(name)}
  </span>
);
