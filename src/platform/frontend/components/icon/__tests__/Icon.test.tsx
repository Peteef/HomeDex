import { render } from '@testing-library/react';
import { CircleHelp, ShoppingCart } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Icon } from '../Icon.tsx';

const svgOf = (container: HTMLElement): SVGElement | null => container.querySelector('svg');

describe('Icon', () => {
  it('should draw the icon of the name when the name is known', () => {
    // Given
    const expected = render(<ShoppingCart />).container;

    // When
    const { container } = render(<Icon name="cart" />);

    // Then
    expect(svgOf(container)?.outerHTML).toBe(svgOf(expected)?.outerHTML);
  });

  it('should draw the fallback when the name is unknown', () => {
    // Given
    const expected = render(<CircleHelp />).container;

    // When
    const { container } = render(<Icon name="no-such-icon" />);

    // Then
    expect(svgOf(container)?.outerHTML).toBe(svgOf(expected)?.outerHTML);
  });

  it('should hide the svg from screen readers', () => {
    // When
    const { container } = render(<Icon name="cart" />);

    // Then
    expect(svgOf(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('should pass props on when they are given', () => {
    // When
    const { container } = render(<Icon name="cart" size={30} />);

    // Then
    expect(svgOf(container)).toHaveAttribute('width', '30');
  });
});
