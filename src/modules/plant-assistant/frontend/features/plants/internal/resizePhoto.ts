const MAX_SIDE_PX = 1600;
const JPEG_TYPE = 'image/jpeg';
const JPEG_QUALITY = 0.82;
const LOWER_JPEG_QUALITIES = [0.7, 0.55];
// The server's limit for a photo.
const PHOTO_MAX_BYTES = 1536 * 1024;
const DATA_URL_SEPARATOR = ',';

const canvasBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const settle = (blob: Blob | null): void => {
      if (blob === null) {
        reject(new Error('The canvas gave no JPEG'));
      } else {
        resolve(blob);
      }
    };

    canvas.toBlob(settle, JPEG_TYPE, quality);
  });

// A photo too large for the server is encoded again at a lower quality, as long as one is left.
const fittingJpeg = async (
  canvas: HTMLCanvasElement,
  quality: number,
  lowerQualities: number[],
): Promise<Blob> => {
  const blob = await canvasBlob(canvas, quality);
  const [nextQuality, ...otherQualities] = lowerQualities;

  return blob.size <= PHOTO_MAX_BYTES || nextQuality === undefined
    ? blob
    : fittingJpeg(canvas, nextQuality, otherQualities);
};

const base64Of = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    const loaded = (): void => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      resolve(dataUrl.split(DATA_URL_SEPARATOR)[1] ?? '');
    };

    reader.onload = loaded;

    reader.onerror = () => {
      reject(reader.error ?? new Error('The photo could not be read'));
    };

    reader.readAsDataURL(blob);
  });

// Decodes the photo on the device (createImageBitmap applies its orientation), shrinks it to at
// most 1600 px on the longer side and re-encodes it as JPEG, which drops all metadata such as
// the GPS location. Rejects when the browser cannot decode the file.
export const resizePhoto = async (file: Blob): Promise<string> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');

  if (context === null) {
    bitmap.close();
    throw new Error('The browser has no 2D canvas');
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return base64Of(await fittingJpeg(canvas, JPEG_QUALITY, LOWER_JPEG_QUALITIES));
};
