import { describe, expect, it } from 'vitest';
import { SCENE_LAYERS } from '../sceneLayers.ts';

describe('scene layers', () => {
  it('should draw the background first', () => {
    // When / Then
    expect(SCENE_LAYERS[0]?.src).toBe('/media/scene/background.webp');
  });

  it('should load every layer from the media location', () => {
    // When / Then
    expect(SCENE_LAYERS.every((layer) => layer.src.startsWith('/media/'))).toBe(true);
  });
});
