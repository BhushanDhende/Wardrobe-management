/**
 * WardrobeAI Client-Side Image Compression Utility
 * Resizes full-resolution mobile camera photos to max 1024px
 * while preserving aspect ratio and reducing network payload by ~90%.
 */

export interface CompressionResult {
  dataUrl: string;
  base64Data: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export async function compressImage(
  fileOrDataUrl: File | Blob | string,
  maxDimension = 1024,
  quality = 0.82
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;

      // Scale down if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const base64Data = dataUrl.split(',')[1] || '';

      // Calculate approximate byte size
      const sizeBytes = Math.round((base64Data.length * 3) / 4);

      resolve({
        dataUrl,
        base64Data,
        mimeType,
        width,
        height,
        sizeBytes,
      });
    };

    img.onerror = (err) => {
      reject(new Error(`Failed to load image for compression: ${err}`));
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
        } else {
          reject(new Error('FileReader returned non-string result'));
        }
      };
      reader.onerror = () => reject(new Error('Failed reading file'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
