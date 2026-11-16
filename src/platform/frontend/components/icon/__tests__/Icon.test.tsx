import { render } from '@testing-library/react';
import { CircleHelp } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Icon } from '../Icon.tsx';

const svgOf = (container: HTMLElement): SVGElement | null => container.querySelector('svg');

describe('Icon', () => {
  it('should draw an svg when the name is known', () => {
    // When
    const { container } = render(<Icon name="cart" />);

    // Then
    expect(svgOf(container)).toBeInTheDocument();
    expect(svgOf(container)?.getAttribute('class')).not.toContain('circle-help');
  });

  it('should draw the fallback when the name is unknown', () => {
    // Given
    const fallback = render(<CircleHelp />).container;

    // When
    const { container } = render(<Icon name="no-such-icon" />);

    // Then
    expect(svgOf(container)?.getAttribute('class')).toBe(svgOf(fallback)?.getAttribute('class'));
    expect(svgOf(container)?.innerHTML).toBe(svgOf(fallback)?.innerHTML);
  });

  it('should pass props on when they are given', () => {
    // When
    const { container } = render(<Icon name="cart" size={30} />);

    // Then
    expect(svgOf(container)).toHaveAttribute('width', '30');
  });
});
