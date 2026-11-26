import { afterEach, describe, expect, it, vi } from 'vitest';
import { resizePhoto } from '../resizePhoto.ts';
import { JPEG_BYTES, stubPhotoDecoding, stubUnreadablePhoto } from './photoStubs.ts';

const FILE = new Blob(['photo'], { type: 'image/heic' });

describe('resizePhoto', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['a landscape photo', 4032, 3024, 1024, 768],
    ['a portrait photo', 3024, 4032, 768, 1024],
    ['a photo already small', 640, 480, 640, 480],
  ])(
    'should draw %s at most 1024 px on its longer side',
    async (_kind, width, height, drawnWidth, drawnHeight) => {
      // Given
      const { drawImage, close } = stubPhotoDecoding(width, height);

      // When
      await resizePhoto(FILE);

      // Then
      expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, drawnWidth, drawnHeight);
      expect(close).toHaveBeenCalledOnce();
    },
  );

  it('should answer the photo re-encoded as JPEG, in base64', async () => {
    // Given
    const { toBlob } = stubPhotoDecoding(800, 600);

    // When
    const photo = await resizePhoto(FILE);

    // Then
    expect(atob(photo)).toBe(JPEG_BYTES);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.82);
  });

  it('should reject a photo the browser cannot decode', async () => {
    // Given
    stubUnreadablePhoto();

    // When / Then
    await expect(resizePhoto(FILE)).rejects.toThrow('could not be decoded');
  });
});
