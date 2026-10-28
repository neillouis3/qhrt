import {
  AVATAR_MAX_SOURCE_BYTES,
  AVATAR_MAX_STORED_BYTES,
  AVATAR_PIXEL_SIZE,
  isAvatarMime,
} from '@/lib/userAvatar';

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not process that image.'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

/** Square-crop and compress a photo for profile use. */
export async function resizeAvatarFile(file: File): Promise<Blob> {
  if (!isAvatarMime(file.type)) {
    throw new Error('Use a JPEG, PNG, or WebP photo.');
  }
  if (file.size > AVATAR_MAX_SOURCE_BYTES) {
    throw new Error('That photo is too large. Try a smaller image.');
  }

  const image = await loadImage(file);
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  if (side < 1) {
    throw new Error('Could not read that image.');
  }
  const sx = Math.floor((image.naturalWidth - side) / 2);
  const sy = Math.floor((image.naturalHeight - side) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_PIXEL_SIZE;
  canvas.height = AVATAR_PIXEL_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not process that image.');
  }
  ctx.drawImage(image, sx, sy, side, side, 0, 0, AVATAR_PIXEL_SIZE, AVATAR_PIXEL_SIZE);

  let quality = 0.86;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > AVATAR_MAX_STORED_BYTES && quality > 0.45) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }
  if (blob.size > AVATAR_MAX_STORED_BYTES) {
    throw new Error('That photo is too large. Try a smaller image.');
  }
  return blob;
}
