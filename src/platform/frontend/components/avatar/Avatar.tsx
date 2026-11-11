import { classNames } from '../classNames.ts';

export type AvatarSize = 'md' | 'lg';

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
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

const SIZE_CLASSES: Record<AvatarSize, string> = {
  md: 'size-11 text-xl',
  lg: 'size-16 text-3xl',
};

const FALLBACK_INITIAL = '?';
const HASH_MULTIPLIER = 31;

// The same name always gets the same colour, on every device.
export const avatarColour = (name: string): string => {
  const lower = name.toLowerCase();
  let hash = 0;

  for (let index = 0; index < lower.length; index++) {
    hash = (hash * HASH_MULTIPLIER + lower.charCodeAt(index)) % COLOURS.length;
  }

  return COLOURS[hash] ?? '';
};

// The first character as the reader sees it, so an accented letter or an emoji stays whole.
export const avatarInitial = (name: string): string => {
  const [first] = new Intl.Segmenter().segment(name.trim());
  return (first?.segment ?? FALLBACK_INITIAL).toLocaleUpperCase();
};

// A placeholder picture: the first letter of the name on a colour picked from the name. The name
// is always shown next to it, so screen readers skip it.
export const Avatar = ({ name, size = 'md' }: AvatarProps) => (
  <span
    aria-hidden="true"
    className={classNames(
      'flex shrink-0 items-center justify-center rounded-full font-extrabold text-white',
      avatarColour(name),
      SIZE_CLASSES[size],
    )}
  >
    {avatarInitial(name)}
  </span>
);
