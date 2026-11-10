import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Scene } from '../Scene.tsx';
import type { SceneLayer } from '../Scene.tsx';

const LAYERS: SceneLayer[] = [
  { src: '/media/back.svg' },
  { src: '/media/sprite.svg', className: 'motion-safe:animate-float' },
];

describe('Scene', () => {
  it('should draw the layers in the given order', () => {
    // When
    const { container } = render(<Scene layers={LAYERS} />);

    // Then
    const sources = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(sources).toEqual(['/media/back.svg', '/media/sprite.svg']);
  });

  it('should hide the whole scene from screen readers', () => {
    // When
    const { container } = render(<Scene layers={LAYERS} />);

    // Then
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('img[alt=""]')).toHaveLength(LAYERS.length);
  });

  it('should add the class names of a layer to its image', () => {
    // When
    const { container } = render(<Scene layers={LAYERS} />);

    // Then
    expect(container.querySelector('img[src="/media/sprite.svg"]')).toHaveClass(
      'motion-safe:animate-float',
    );
    expect(container.querySelector('img[src="/media/back.svg"]')).not.toHaveClass(
      'motion-safe:animate-float',
    );
  });

  it('should draw nothing when there are no layers', () => {
    // When
    const { container } = render(<Scene layers={[]} />);

    // Then
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });
});
