import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Scene } from '../Scene.tsx';
import type { SceneLayer } from '../Scene.tsx';

const LAYERS: SceneLayer[] = [
  { src: '/media/back.svg' },
  { src: '/media/sprite.svg', className: 'opacity-80' },
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
    expect(container.querySelector('img[src="/media/sprite.svg"]')).toHaveClass('opacity-80');
    expect(container.querySelector('img[src="/media/back.svg"]')).not.toHaveClass('opacity-80');
  });

  it('should not pan any layer while the last one is still loading', () => {
    // Given
    const { container } = render(<Scene layers={LAYERS} />);
    const images = [...container.querySelectorAll('img')];

    // When
    for (const image of images.slice(0, -1)) {
      fireEvent.load(image);
    }

    // Then
    for (const image of images) {
      expect(image).not.toHaveClass('no-hover:motion-safe:animate-pan');
    }
  });

  it('should pan every layer on a touch device that allows motion when all have loaded', () => {
    // Given
    const { container } = render(<Scene layers={LAYERS} />);
    const images = [...container.querySelectorAll('img')];

    // When
    for (const image of images) {
      fireEvent.load(image);
    }

    // Then
    for (const image of images) {
      expect(image).toHaveClass('no-hover:motion-safe:animate-pan');
      expect(image).not.toHaveClass('animate-pan');
    }
  });

  it('should draw nothing when there are no layers', () => {
    // When
    const { container } = render(<Scene layers={[]} />);

    // Then
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });
});
