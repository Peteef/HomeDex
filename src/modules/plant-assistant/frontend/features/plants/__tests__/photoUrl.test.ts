import { describe, expect, it } from 'vitest';
import { photoUrl } from '../index.ts';

describe('photoUrl', () => {
  it("should give the photo's address with its id", () => {
    // When / Then
    expect(photoUrl({ id: 3, photoId: 12 })).toBe('/api/m/plant-assistant/plants/3/photo?v=12');
  });

  it('should give nothing for a plant without a photo', () => {
    // When / Then
    expect(photoUrl({ id: 3, photoId: null })).toBeNull();
  });
});
