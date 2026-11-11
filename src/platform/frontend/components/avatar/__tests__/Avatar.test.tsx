import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, avatarColour, avatarInitial } from '../Avatar.tsx';

describe('Avatar', () => {
  describe('avatarInitial', () => {
    it.each([
      ['misty', 'M'],
      ['  brock', 'B'],
      ['élise', 'É'],
      ['', '?'],
    ])('should turn %o into %o', (name, initial) => {
      // When / Then
      expect(avatarInitial(name)).toBe(initial);
    });
  });

  describe('avatarColour', () => {
    it('should give a name the same colour every time, whatever its case', () => {
      // When / Then
      expect(avatarColour('Misty')).toBe(avatarColour('misty'));
    });

    it('should spread different names over several colours', () => {
      // When
      const colours = new Set(['Ash', 'Misty', 'Brock', 'Gary', 'Dawn', 'May'].map(avatarColour));

      // Then
      expect(colours.size).toBeGreaterThan(1);
    });
  });

  it('should show the initial on a colour and hide it from screen readers', () => {
    // When
    const { container } = render(<Avatar name="Misty" />);

    // Then
    const avatar = container.firstElementChild;
    expect(avatar).toHaveTextContent('M');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(avatar).toHaveClass(avatarColour('Misty'));
  });
});
