import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SCENE_LAYERS } from '../layers.ts';
import { Scene } from '../Scene.tsx';

describe('Scene', () => {
  it('should draw the background first and every layer from the media location', () => {
    // When
    const { container } = render(<Scene />);

    // Then
    const sources = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(sources).toEqual(SCENE_LAYERS.map((layer) => layer.src));
    expect(sources[0]).toBe('/media/scene/background.svg');
    expect(sources.every((src) => src?.startsWith('/media/'))).toBe(true);
  });

  it('should hide the whole scene from screen readers', () => {
    // When
    const { container } = render(<Scene />);

    // Then
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('img[alt=""]')).toHaveLength(SCENE_LAYERS.length);
  });

  it('should animate sprites only when motion is allowed', () => {
    // When
    const { container } = render(<Scene />);

    // Then
    const animated = container.querySelectorAll('img[class*="animate-float"]');
    expect(animated.length).toBeGreaterThan(0);
    for (const img of animated) {
      expect(img.className).toContain('motion-safe:animate-float');
    }
  });

  it('should draw the layers it is given', () => {
    // When
    const { container } = render(<Scene layers={[{ src: '/media/other.svg' }]} />);

    // Then
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });
});
