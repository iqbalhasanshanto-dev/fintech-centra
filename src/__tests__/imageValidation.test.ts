import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateImageFile,
  detectImageSignature,
  dataUrlToBlob,
  processImage,
  MAX_RAW_IMAGE_SIZE,
  MAX_AVATAR_BYTES,
  MAX_AVATAR_DIMENSION,
} from '../utils/imageValidation';

describe('Image Signature Detection (Magic Bytes)', () => {
  it('detects JPEG magic bytes (FF D8 FF)', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    expect(detectImageSignature(bytes).format).toBe('jpeg');
  });

  it('detects PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)', () => {
    const bytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    expect(detectImageSignature(bytes).format).toBe('png');
  });

  it('detects WebP magic bytes (RIFF ... WEBP)', () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(detectImageSignature(bytes).format).toBe('webp');
  });

  it('detects executable binary header (MZ / 4D 5A)', () => {
    const bytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    expect(detectImageSignature(bytes).format).toBe('exe');
  });

  it('detects GIF magic bytes (GIF87a / GIF89a)', () => {
    const bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00]);
    expect(detectImageSignature(bytes).format).toBe('gif');
  });

  it('detects PDF magic bytes (%PDF)', () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    expect(detectImageSignature(bytes).format).toBe('pdf');
  });

  it('detects SVG xml text content', () => {
    const bytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(detectImageSignature(bytes).format).toBe('svg');
  });

  it('detects HEIC ftyp brand', () => {
    const bytes = new Uint8Array([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
    ]);
    expect(detectImageSignature(bytes).format).toBe('heic');
  });

  it('identifies arbitrary random bytes as unknown', () => {
    const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    expect(detectImageSignature(bytes).format).toBe('unknown');
  });
});

describe('validateImageFile', () => {
  it('accepts a valid JPEG file', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const file = new File([bytes], 'photo.jpg', { type: 'image/jpeg' });
    const result = await validateImageFile(file);
    expect(result.ok).toBe(true);
    expect(result.format).toBe('jpeg');
    expect(result.mimeType).toBe('image/jpeg');
  });

  it('accepts a valid PNG file', async () => {
    const bytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const file = new File([bytes], 'receipt.png', { type: 'image/png' });
    const result = await validateImageFile(file);
    expect(result.ok).toBe(true);
    expect(result.format).toBe('png');
    expect(result.mimeType).toBe('image/png');
  });

  it('accepts a valid WebP file', async () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    const file = new File([bytes], 'avatar.webp', { type: 'image/webp' });
    const result = await validateImageFile(file);
    expect(result.ok).toBe(true);
    expect(result.format).toBe('webp');
    expect(result.mimeType).toBe('image/webp');
  });

  it('rejects a renamed executable file (.exe renamed to .jpg)', async () => {
    const bytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const file = new File([bytes], 'invoice.jpg', { type: 'image/jpeg' });
    const result = await validateImageFile(file);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Executable files are strictly forbidden');
  });

  it('rejects an SVG file renamed to .png', async () => {
    const bytes = new TextEncoder().encode(
      '<?xml version="1.0"?><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg>'
    );
    const file = new File([bytes], 'badge.png', { type: 'image/png' });
    const result = await validateImageFile(file);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('SVG files are not permitted');
  });

  it('rejects a plain text file renamed to .jpg', async () => {
    const bytes = new TextEncoder().encode('This is just plain text, definitely not a JPEG image.');
    const file = new File([bytes], 'avatar.jpg', { type: 'image/jpeg' });
    const result = await validateImageFile(file);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Unsupported image format');
  });

  it('rejects an animated GIF file', async () => {
    const bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00]);
    const file = new File([bytes], 'anim.gif', { type: 'image/gif' });
    const result = await validateImageFile(file);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('GIF images are not supported');
  });

  it('rejects a PDF file renamed to .jpg', async () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const file = new File([bytes], 'statement.jpg', { type: 'image/jpeg' });
    const result = await validateImageFile(file);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('PDF documents cannot be used as an image');
  });

  it('rejects HEIC by default and documents optional allowance', async () => {
    const bytes = new Uint8Array([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
    ]);
    const file = new File([bytes], 'photo.heic', { type: 'image/heic' });

    // Off by default
    const defaultResult = await validateImageFile(file);
    expect(defaultResult.ok).toBe(false);
    expect(defaultResult.error).toContain('HEIC/HEIF images are not supported by default');

    // Allowed when optional flag is enabled
    const allowedResult = await validateImageFile(file, { allowHeic: true });
    expect(allowedResult.ok).toBe(true);
    expect(allowedResult.format).toBe('heic');
  });

  it('rejects files larger than 5 MB', async () => {
    const oversizedBlob = new Blob([new Uint8Array(MAX_RAW_IMAGE_SIZE + 1024)]);
    const result = await validateImageFile(oversizedBlob);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('File is too large');
  });
});

describe('dataUrlToBlob', () => {
  it('converts base64 data URLs to binary Blobs with matching MIME types', () => {
    // 1x1 white pixel in base64
    const dataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg==';
    const blob = dataUrlToBlob(dataUrl);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('processImage (Canvas-based metadata stripping and downscaling)', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-image-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock Image onload trigger
    class MockImage {
      private _src = '';
      naturalWidth = 2000;
      naturalHeight = 1000;
      width = 2000;
      height = 1000;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      get src(): string {
        return this._src;
      }

      set src(val: string) {
        this._src = val;
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    }
    vi.stubGlobal('Image', MockImage);

    // Mock HTMLCanvasElement getContext, toDataURL, and toBlob
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    });
    HTMLCanvasElement.prototype.toDataURL = vi.fn(
      () =>
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    );
  });

  it('downscales an image exceeding maxDimension to 1600px', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const file = new File([bytes], 'large_receipt.jpg', { type: 'image/jpeg' });

    const processed = await processImage(file, { maxDimension: 1600 });
    expect(processed.width).toBe(1600);
    expect(processed.height).toBe(800);
    expect(processed.dataUrl).toContain('data:image/jpeg');
    expect(processed.blob).toBeInstanceOf(Blob);
  });

  it('downscales avatars to 512px maxDimension and enforces avatar constraints', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const file = new File([bytes], 'large_avatar.jpg', { type: 'image/jpeg' });

    const processed = await processImage(file, {
      maxDimension: MAX_AVATAR_DIMENSION,
      maxSizeBytes: MAX_AVATAR_BYTES,
    });
    expect(processed.width).toBe(512);
    expect(processed.height).toBe(256);
    expect(processed.dataUrl.length).toBeGreaterThan(0);
    expect(processed.sizeBytes).toBeLessThanOrEqual(MAX_AVATAR_BYTES);
  });
});
