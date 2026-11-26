import { vi } from 'vitest';

// jsdom has no image decoding and no canvas: a fake bitmap of the given size, and a canvas that
// records how it was drawn and answers a fixed JPEG.
export const JPEG_BYTES = 'fake jpeg';

export const stubPhotoDecoding = (width: number, height: number) => {
  const close = vi.fn();
  const drawImage = vi.fn();

  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(() => Promise.resolve({ width, height, close })),
  );

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage,
  } as unknown as CanvasRenderingContext2D);

  const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
    callback(new Blob([JPEG_BYTES], { type: 'image/jpeg' }));
  });

  return {
    close,
    drawImage,
    toBlob,
  };
};

export const stubUnreadablePhoto = () => {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(() => Promise.reject(new DOMException('The source image could not be decoded.'))),
  );
};
