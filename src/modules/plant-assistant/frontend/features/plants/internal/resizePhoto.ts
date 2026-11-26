const MAX_SIDE_PX = 1024;
const JPEG_TYPE = 'image/jpeg';
const JPEG_QUALITY = 0.82;
const DATA_URL_SEPARATOR = ',';

const canvasBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          reject(new Error('The canvas gave no JPEG'));
        } else {
          resolve(blob);
        }
      },
      JPEG_TYPE,
      JPEG_QUALITY,
    );
  });

const base64Of = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      resolve(dataUrl.split(DATA_URL_SEPARATOR)[1] ?? '');
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('The photo could not be read'));
    };

    reader.readAsDataURL(blob);
  });

// Decodes the photo on the device (createImageBitmap applies its orientation), shrinks it to at
// most 1024 px on the longer side and re-encodes it as JPEG, which drops all metadata such as
// the GPS location (PRD section 9). Rejects when the browser cannot decode the file.
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
  return base64Of(await canvasBlob(canvas));
};
