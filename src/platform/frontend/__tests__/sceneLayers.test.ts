import { describe, expect, it } from 'vitest';
import { SCENE_LAYERS } from '../sceneLayers.ts';

describe('scene layers', () => {
  it('should draw the day background first by day', () => {
    // When / Then
    expect(SCENE_LAYERS.day[0]?.src).toBe('/media/scene/day/background.webp');
  });

  it('should draw the night background first by night', () => {
    // When / Then
    expect(SCENE_LAYERS.night[0]?.src).toBe('/media/scene/night/background.webp');
  });

  it('should load every layer from the media location', () => {
    // When
    const layers = [...SCENE_LAYERS.day, ...SCENE_LAYERS.night];

    // Then
    expect(layers.every((layer) => layer.src.startsWith('/media/'))).toBe(true);
  });
});
