import { describe, expect, it } from 'vitest';
import { SCENE_LAYERS } from '../sceneLayers.ts';

describe('scene layers', () => {
  it('should draw the background first', () => {
    // When / Then
    expect(SCENE_LAYERS[0]?.src).toBe('/media/scene/background.svg');
  });

  it('should load every layer from the media location', () => {
    // When / Then
    expect(SCENE_LAYERS.every((layer) => layer.src.startsWith('/media/'))).toBe(true);
  });

  it('should animate sprites only when motion is allowed', () => {
    // Given
    const animated = SCENE_LAYERS.filter((layer) => layer.className?.includes('animate-float'));

    // When / Then
    expect(animated.length).toBeGreaterThan(0);
    for (const layer of animated) {
      expect(layer.className).toContain('motion-safe:animate-float');
    }
  });
});
