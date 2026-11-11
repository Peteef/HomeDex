import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from '../Avatar.tsx';

const renderAvatar = (name: string): Element => {
  const { container } = render(<Avatar name={name} />);
  const avatar = container.firstElementChild;

  if (!avatar) {
    throw new Error('The avatar did not render');
  }

  return avatar;
};

const colourOf = (avatar: Element): string | undefined =>
  [...avatar.classList].find((name) => name.startsWith('bg-avatar-'));

describe('Avatar', () => {
  it.each([
    ['misty', 'M'],
    ['  brock', 'B'],
    ['élise', 'É'],
    ['', '?'],
  ])('should show the initial of %o as %o', (name, initial) => {
    // When / Then
    expect(renderAvatar(name)).toHaveTextContent(initial);
  });

  it('should hide the avatar from screen readers', () => {
    // When / Then
    expect(renderAvatar('Misty')).toHaveAttribute('aria-hidden', 'true');
  });

  it('should give a name the same colour every time, whatever its case', () => {
    // When
    const colour = colourOf(renderAvatar('Misty'));

    // Then
    expect(colour).toBeDefined();
    expect(colourOf(renderAvatar('misty'))).toBe(colour);
  });

  it('should spread different names over several colours', () => {
    // When
    const colours = new Set(
      ['Ash', 'Misty', 'Brock', 'Gary', 'Dawn', 'May'].map((name) => colourOf(renderAvatar(name))),
    );

    // Then
    expect(colours.size).toBeGreaterThan(1);
  });
});
