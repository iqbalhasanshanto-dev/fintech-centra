import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper PNG encoders / decoders for 100% deterministic pixel-perfect icons
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ -1;
}

function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.slice(4, 8 + len));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (1 + width * 4);
    scanlines[scanlineOffset] = 0;
    rgbaBuffer.copy(scanlines, scanlineOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(scanlines, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressedData),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

function decodePng(buf) {
  let pos = 8;
  let width, height;
  const idatChunks = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
    } else if (type === 'IDAT') {
      idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = 4;
  const rowBytes = width * bpp;
  const raw = Buffer.alloc(width * height * 4);
  let srcPos = 0;
  for (let y = 0; y < height; y++) {
    const filterType = decompressed[srcPos++];
    const prevRowOffset = (y - 1) * rowBytes;
    const currRowOffset = y * rowBytes;
    for (let x = 0; x < rowBytes; x++) {
      const byte = decompressed[srcPos++];
      const a = x >= bpp ? raw[currRowOffset + x - bpp] : 0;
      const b = y > 0 ? raw[prevRowOffset + x] : 0;
      const c = (x >= bpp && y > 0) ? raw[prevRowOffset + x - bpp] : 0;
      let val = byte;
      if (filterType === 1) val = (byte + a) & 0xff;
      else if (filterType === 2) val = (byte + b) & 0xff;
      else if (filterType === 3) val = (byte + Math.floor((a + b) / 2)) & 0xff;
      else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        let pr = c;
        if (pa <= pb && pa <= pc) pr = a;
        else if (pb <= pc) pr = b;
        val = (byte + pr) & 0xff;
      }
      raw[currRowOffset + x] = val;
    }
  }
  return { width, height, data: raw };
}

function scaleImage(src, srcW, srcH, dstW, dstH) {
  const dst = Buffer.alloc(dstW * dstH * 4);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  for (let dstY = 0; dstY < dstH; dstY++) {
    const srcY = dstY * yRatio;
    const yFloor = Math.floor(srcY);
    const yCeil = Math.min(srcH - 1, Math.ceil(srcY));
    const yWeight = srcY - yFloor;

    for (let dstX = 0; dstX < dstW; dstX++) {
      const srcX = dstX * xRatio;
      const xFloor = Math.floor(srcX);
      const xCeil = Math.min(srcW - 1, Math.ceil(srcX));
      const xWeight = srcX - xFloor;

      const idx00 = (yFloor * srcW + xFloor) * 4;
      const idx10 = (yFloor * srcW + xCeil) * 4;
      const idx01 = (yCeil * srcW + xFloor) * 4;
      const idx11 = (yCeil * srcW + xCeil) * 4;

      const dstIdx = (dstY * dstW + dstX) * 4;

      for (let c = 0; c < 4; c++) {
        const top = src[idx00 + c] * (1 - xWeight) + src[idx10 + c] * xWeight;
        const bottom = src[idx01 + c] * (1 - xWeight) + src[idx11 + c] * xWeight;
        dst[dstIdx + c] = Math.round(top * (1 - yWeight) + bottom * yWeight);
      }
    }
  }
  return dst;
}

// Extract high-resolution raster from logo-on-dark.svg if present, otherwise use centra-logo-dark.png
let sourceLogo = path.join(rootDir, 'public/centra-logo-dark.png');
const svgPath = path.join(rootDir, 'src/assets/brand/logo-on-dark.svg');
const fallbackSvgPath = path.join(rootDir, 'public/logo-on-dark.svg');
const highResTemp = '/tmp/centra_dark_logo_highres.png';

const targetSvg = fs.existsSync(svgPath) ? svgPath : fallbackSvgPath;
let decodedSource;

if (fs.existsSync(targetSvg)) {
  const svg = fs.readFileSync(targetSvg, 'utf8');
  const match = svg.match(/href="data:image\/png;base64,([^"]+)"/);
  if (match) {
    const buf = Buffer.from(match[1], 'base64');
    fs.writeFileSync(highResTemp, buf);
    sourceLogo = highResTemp;
    decodedSource = decodePng(buf);
  }
}

if (!decodedSource && fs.existsSync(sourceLogo)) {
  decodedSource = decodePng(fs.readFileSync(sourceLogo));
}

// Crop tightly to non-transparent pixels
let minX = decodedSource.width, maxX = 0, minY = decodedSource.height, maxY = 0;
for (let y = 0; y < decodedSource.height; y++) {
  for (let x = 0; x < decodedSource.width; x++) {
    const a = decodedSource.data[(y * decodedSource.width + x) * 4 + 3];
    if (a > 10) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;
const croppedLogo = Buffer.alloc(cropW * cropH * 4);
for (let y = 0; y < cropH; y++) {
  const srcOffset = ((minY + y) * decodedSource.width + minX) * 4;
  decodedSource.data.copy(croppedLogo, y * cropW * 4, srcOffset, srcOffset + cropW * 4);
}

// 1. Android Launcher Icons (mipmap-*)
// Safe-zone diameter is 66dp within 108dp adaptive foreground canvas.
const densities = [
  { name: 'mdpi', size: 48, fgSize: 108, logoSize: 36, fgLogoSize: 60 },
  { name: 'hdpi', size: 72, fgSize: 162, logoSize: 54, fgLogoSize: 90 },
  { name: 'xhdpi', size: 96, fgSize: 216, logoSize: 72, fgLogoSize: 120 },
  { name: 'xxhdpi', size: 144, fgSize: 324, logoSize: 108, fgLogoSize: 180 },
  { name: 'xxxhdpi', size: 192, fgSize: 432, logoSize: 144, fgLogoSize: 240 }
];

for (const d of densities) {
  const dir = path.join(rootDir, `android/app/src/main/res/mipmap-${d.name}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // 1. ic_launcher.png (Solid #000000 pure black background with centered logo)
  const iconCanvas = Buffer.alloc(d.size * d.size * 4);
  for (let i = 0; i < iconCanvas.length; i += 4) {
    iconCanvas[i] = 0;
    iconCanvas[i+1] = 0;
    iconCanvas[i+2] = 0;
    iconCanvas[i+3] = 255;
  }
  const scaledIconLogo = scaleImage(croppedLogo, cropW, cropH, d.logoSize, d.logoSize);
  const iconOffsetX = Math.floor((d.size - d.logoSize) / 2);
  const iconOffsetY = Math.floor((d.size - d.logoSize) / 2);

  for (let y = 0; y < d.logoSize; y++) {
    for (let x = 0; x < d.logoSize; x++) {
      const srcIdx = (y * d.logoSize + x) * 4;
      const dstIdx = ((iconOffsetY + y) * d.size + (iconOffsetX + x)) * 4;
      const a = scaledIconLogo[srcIdx + 3] / 255;
      iconCanvas[dstIdx] = Math.round(scaledIconLogo[srcIdx] * a);
      iconCanvas[dstIdx + 1] = Math.round(scaledIconLogo[srcIdx + 1] * a);
      iconCanvas[dstIdx + 2] = Math.round(scaledIconLogo[srcIdx + 2] * a);
      iconCanvas[dstIdx + 3] = 255;
    }
  }
  const iconPng = createPng(d.size, d.size, iconCanvas);
  fs.writeFileSync(path.join(dir, 'ic_launcher.png'), iconPng);

  // 2. ic_launcher_round.png (Same solid #000000 black background)
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), iconPng);

  // 3. ic_launcher_foreground.png (Transparent rgba(0,0,0,0) background with logo within 66dp safe zone)
  const fgCanvas = Buffer.alloc(d.fgSize * d.fgSize * 4);
  const scaledFgLogo = scaleImage(croppedLogo, cropW, cropH, d.fgLogoSize, d.fgLogoSize);
  const fgOffsetX = Math.floor((d.fgSize - d.fgLogoSize) / 2);
  const fgOffsetY = Math.floor((d.fgSize - d.fgLogoSize) / 2);

  for (let y = 0; y < d.fgLogoSize; y++) {
    for (let x = 0; x < d.fgLogoSize; x++) {
      const srcIdx = (y * d.fgLogoSize + x) * 4;
      const dstIdx = ((fgOffsetY + y) * d.fgSize + (fgOffsetX + x)) * 4;
      fgCanvas[dstIdx] = scaledFgLogo[srcIdx];
      fgCanvas[dstIdx + 1] = scaledFgLogo[srcIdx + 1];
      fgCanvas[dstIdx + 2] = scaledFgLogo[srcIdx + 2];
      fgCanvas[dstIdx + 3] = scaledFgLogo[srcIdx + 3];
    }
  }
  const fgPng = createPng(d.fgSize, d.fgSize, fgCanvas);
  fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), fgPng);

  console.log(`Generated pure black launcher icons for mipmap-${d.name}`);
}

// 2. Android Splash Screens (drawable*)
// Logo bounding box within 48% of shortest dimension on #000000 so Android 12 circular mask does not clip the right tip of the green "C".
const splashScreens = [
  { dir: 'drawable', w: 480, h: 320, file: 'splash.png' },
  { dir: 'drawable-port-mdpi', w: 320, h: 480, file: 'splash.png' },
  { dir: 'drawable-port-hdpi', w: 480, h: 800, file: 'splash.png' },
  { dir: 'drawable-port-xhdpi', w: 720, h: 1280, file: 'splash.png' },
  { dir: 'drawable-port-xxhdpi', w: 960, h: 1600, file: 'splash.png' },
  { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920, file: 'splash.png' },
  { dir: 'drawable-land-mdpi', w: 480, h: 320, file: 'splash.png' },
  { dir: 'drawable-land-hdpi', w: 800, h: 480, file: 'splash.png' },
  { dir: 'drawable-land-xhdpi', w: 1280, h: 720, file: 'splash.png' },
  { dir: 'drawable-land-xxhdpi', w: 1600, h: 960, file: 'splash.png' },
  { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280, file: 'splash.png' },
];

for (const s of splashScreens) {
  const dir = path.join(rootDir, `android/app/src/main/res/${s.dir}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const shortest = Math.min(s.w, s.h);
  const logoSize = Math.round(shortest * 0.48);
  const tempSplashLogo = `/tmp/centra_splash_logo_${shortest}.png`;

  execSync(`sips -z ${logoSize} ${logoSize} "${sourceLogo}" --out "${tempSplashLogo}"`);
  execSync(`sips -p ${s.h} ${s.w} --padColor 000000 "${tempSplashLogo}" --out "${path.join(dir, s.file)}"`);
  console.log(`Generated splash for ${s.dir}/${s.file} (${s.w}x${s.h})`);
}

// 3. Android 12+ Splash Animated Icons (splash_icon.png)
const splashIcons = [
  { dir: 'drawable-mdpi', size: 160 },
  { dir: 'drawable-night-mdpi', size: 160 },
  { dir: 'drawable-hdpi', size: 240 },
  { dir: 'drawable-night-hdpi', size: 240 },
  { dir: 'drawable-xhdpi', size: 320 },
  { dir: 'drawable-night-xhdpi', size: 320 },
  { dir: 'drawable-xxhdpi', size: 480 },
  { dir: 'drawable-night-xxhdpi', size: 480 },
  { dir: 'drawable-xxxhdpi', size: 480 },
  { dir: 'drawable-night-xxxhdpi', size: 480 },
];

for (const si of splashIcons) {
  const dir = path.join(rootDir, `android/app/src/main/res/${si.dir}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const logoSize = Math.round(si.size * 0.48);
  const tempSiLogo = `/tmp/centra_si_logo_${si.size}.png`;

  execSync(`sips -z ${logoSize} ${logoSize} "${sourceLogo}" --out "${tempSiLogo}"`);
  execSync(`sips -p ${si.size} ${si.size} "${tempSiLogo}" --out "${path.join(dir, 'splash_icon.png')}"`);
  console.log(`Generated splash_icon for ${si.dir}/splash_icon.png (${si.size}x${si.size})`);
}

console.log('✅ All Android launcher icons and splash screens successfully updated with dark logo on #000000!');
