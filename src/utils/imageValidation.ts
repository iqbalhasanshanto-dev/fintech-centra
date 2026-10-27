/**
 * Image Validation & Canvas-Based Processing
 *
 * 1. validateImageFile:
 *    - Strictly validates file signatures (magic bytes) from raw binary buffers.
 *    - Accepts only JPEG (FF D8 FF), PNG (89 50 4E 47 0D 0A 1A 0A), and WebP (RIFF....WEBP).
 *    - Rejects SVG, GIF, PDF, Windows executables (.exe), and unknown formats with clear user-facing errors.
 *    - Rejects files exceeding the max size limit (default 5 MB).
 *    - HEIC/HEIF is documented as an optional case (off by default via allowHeic flag).
 *
 * 2. processImage:
 *    - Decodes image into HTML Canvas in the browser.
 *    - Downscales to max dimension (1600px for receipts, 512px for avatars).
 *    - Re-encodes as clean JPEG (or WebP), inherently stripping EXIF, GPS, and camera metadata.
 *    - Caps avatars at ~100 KB to prevent database column bloat in profiles.avatar_url.
 */

export interface ImageValidationResult {
  ok: boolean;
  format?: 'jpeg' | 'png' | 'webp' | 'heic';
  mimeType?: string;
  error?: string;
}

export interface ImageValidationOptions {
  maxSizeBytes?: number; // Default: 5 * 1024 * 1024 (5 MB)
  allowHeic?: boolean;   // Default: false
}

export interface ProcessImageOptions {
  maxDimension?: number;   // 512 for avatars, 1600 for receipts (default: 1600)
  maxSizeBytes?: number;   // e.g. 100 * 1024 (100 KB) for avatars
  format?: 'image/jpeg' | 'image/webp'; // Default: 'image/jpeg'
  quality?: number;        // Default: 0.85
}

export interface ProcessedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export const MAX_RAW_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_AVATAR_DIMENSION = 512;           // 512 px max side
export const MAX_AVATAR_BYTES = 100 * 1024;        // ~100 KB cap for DB column
export const MAX_RECEIPT_DIMENSION = 1600;         // 1600 px max side

/**
 * Detect image format from magic bytes buffer.
 */
export function detectImageSignature(bytes: Uint8Array): {
  format: 'jpeg' | 'png' | 'webp' | 'gif' | 'svg' | 'pdf' | 'exe' | 'heic' | 'unknown';
} {
  if (bytes.length < 2) {
    return { format: 'unknown' };
  }

  // Windows Executable: MZ (4D 5A)
  if (bytes[0] === 0x4d && bytes[1] === 0x5a) {
    return { format: 'exe' };
  }

  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { format: 'jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { format: 'png' };
  }

  // WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50   // P
  ) {
    return { format: 'webp' };
  }

  // GIF: GIF87a or GIF89a
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 && // G
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x38 && // 8
    (bytes[4] === 0x37 || bytes[4] === 0x39) && // 7 or 9
    bytes[5] === 0x61   // a
  ) {
    return { format: 'gif' };
  }

  // PDF: %PDF (25 50 44 46)
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return { format: 'pdf' };
  }

  // HEIC/HEIF: bytes 4-7 are 'ftyp' (66 74 79 70) with brand heic, heix, mif1, msf1
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 && // f
    bytes[5] === 0x74 && // t
    bytes[6] === 0x79 && // y
    bytes[7] === 0x70    // p
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (['heic', 'heix', 'hevc', 'mif1', 'msf1'].includes(brand)) {
      return { format: 'heic' };
    }
  }

  // SVG detection: Inspect text representation of initial 128 bytes
  try {
    const textChunk = new TextDecoder('utf-8', { fatal: false })
      .decode(bytes.slice(0, 128))
      .trim()
      .toLowerCase();
    if (
      textChunk.startsWith('<svg') ||
      textChunk.startsWith('<?xml') ||
      textChunk.includes('<svg') ||
      textChunk.startsWith('<!doctype svg')
    ) {
      return { format: 'svg' };
    }
  } catch {
    // Non-text binary
  }

  return { format: 'unknown' };
}

/**
 * Validate an image file or blob by checking:
 * 1. Raw file size does not exceed max limit (default 5 MB)
 * 2. True magic byte signature matches JPEG, PNG, or WebP
 * 3. Rejects SVG, GIF, PDF, executables, and unapproved formats
 */
export async function validateImageFile(
  file: File | Blob,
  options?: ImageValidationOptions
): Promise<ImageValidationResult> {
  const maxBytes = options?.maxSizeBytes ?? MAX_RAW_IMAGE_SIZE;
  const allowHeic = options?.allowHeic ?? false;

  if (!file) {
    return { ok: false, error: 'No file provided.' };
  }

  // 1. File size check
  if (file.size > maxBytes) {
    const mbLimit = Math.round(maxBytes / (1024 * 1024));
    return {
      ok: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${mbLimit} MB.`,
    };
  }

  // 2. Read first 64 bytes for magic numbers
  let headerBytes: Uint8Array;
  try {
    const slice = file.slice(0, 64);
    const arrayBuffer = await slice.arrayBuffer();
    headerBytes = new Uint8Array(arrayBuffer);
  } catch {
    return { ok: false, error: 'Could not read file content. Please try again.' };
  }

  const { format } = detectImageSignature(headerBytes);

  switch (format) {
    case 'jpeg':
      return { ok: true, format: 'jpeg', mimeType: 'image/jpeg' };
    case 'png':
      return { ok: true, format: 'png', mimeType: 'image/png' };
    case 'webp':
      return { ok: true, format: 'webp', mimeType: 'image/webp' };
    case 'heic':
      if (allowHeic) {
        return { ok: true, format: 'heic', mimeType: 'image/heic' };
      }
      return {
        ok: false,
        error: 'HEIC/HEIF images are not supported by default. Please convert to JPEG, PNG, or WebP.',
      };
    case 'svg':
      return {
        ok: false,
        error: 'SVG files are not permitted for security reasons. Please upload a JPEG, PNG, or WebP image.',
      };
    case 'gif':
      return {
        ok: false,
        error: 'Animated GIF images are not supported. Please upload a JPEG, PNG, or WebP image.',
      };
    case 'pdf':
      return {
        ok: false,
        error: 'PDF documents cannot be used as an image. Please upload a JPEG, PNG, or WebP image.',
      };
    case 'exe':
      return {
        ok: false,
        error: 'Executable files are strictly forbidden.',
      };
    default:
      return {
        ok: false,
        error: 'Unsupported image format. Centra only accepts JPEG, PNG, and WebP images.',
      };
  }
}

/**
 * Convert a base64 data URL to a binary Blob.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const base64Str = parts[1] || '';
  const binaryStr = atob(base64Str);
  const len = binaryStr.length;
  const u8arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    u8arr[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Decode image into an HTMLImageElement safely.
 */
function loadImageElement(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image data.'));
    };
    img.src = objectUrl;
  });
}

/**
 * Process, downscale and re-encode an image:
 * - Downscales to maxDimension (1600 for receipts, 512 for avatars).
 * - Canvas re-encoding strips EXIF, GPS, camera metadata.
 * - Compresses to fit within maxSizeBytes (e.g. 100 KB for avatars).
 * - Returns both clean Blob and preview dataUrl.
 */
export async function processImage(
  file: File | Blob,
  options?: ProcessImageOptions
): Promise<ProcessedImageResult> {
  const maxDimension = options?.maxDimension ?? MAX_RECEIPT_DIMENSION;
  const targetFormat = options?.format ?? 'image/jpeg';
  const initialQuality = options?.quality ?? 0.85;
  const maxSizeBytes = options?.maxSizeBytes;

  const img = await loadImageElement(file);

  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (origWidth > maxDimension || origHeight > maxDimension) {
    if (origWidth >= origHeight) {
      targetWidth = maxDimension;
      targetHeight = Math.max(1, Math.round((origHeight * maxDimension) / origWidth));
    } else {
      targetHeight = maxDimension;
      targetWidth = Math.max(1, Math.round((origWidth * maxDimension) / origHeight));
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // If output format is JPEG, draw a white background so transparent PNGs don't render black
    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  }

  let quality = initialQuality;
  let dataUrl = canvas.toDataURL(targetFormat, quality);
  let blob: Blob = dataUrlToBlob(dataUrl);

  // If maxSizeBytes is specified (e.g. 100 KB for avatars), iteratively reduce quality or dimensions
  if (maxSizeBytes && blob.size > maxSizeBytes) {
    const qualitySteps = [0.75, 0.65, 0.5, 0.4, 0.3];
    for (const q of qualitySteps) {
      quality = q;
      dataUrl = canvas.toDataURL(targetFormat, quality);
      blob = dataUrlToBlob(dataUrl);
      if (blob.size <= maxSizeBytes) {
        break;
      }
    }

    // If still over cap after lowest quality, scale dimensions down further
    if (blob.size > maxSizeBytes && (targetWidth > 256 || targetHeight > 256)) {
      const smallerDim = Math.min(256, maxDimension);
      const scaleDown = smallerDim / Math.max(targetWidth, targetHeight);
      const smallWidth = Math.max(1, Math.round(targetWidth * scaleDown));
      const smallHeight = Math.max(1, Math.round(targetHeight * scaleDown));

      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = smallWidth;
      smallCanvas.height = smallHeight;
      const smallCtx = smallCanvas.getContext('2d');
      if (smallCtx) {
        if (targetFormat === 'image/jpeg') {
          smallCtx.fillStyle = '#FFFFFF';
          smallCtx.fillRect(0, 0, smallWidth, smallHeight);
        }
        smallCtx.drawImage(canvas, 0, 0, smallWidth, smallHeight);
        dataUrl = smallCanvas.toDataURL(targetFormat, 0.6);
        blob = dataUrlToBlob(dataUrl);
        targetWidth = smallWidth;
        targetHeight = smallHeight;
      }
    }
  }

  return {
    blob,
    dataUrl,
    width: targetWidth,
    height: targetHeight,
    sizeBytes: blob.size,
  };
}
