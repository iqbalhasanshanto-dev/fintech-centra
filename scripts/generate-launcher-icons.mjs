import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Extract high-resolution raster from logo-on-dark.svg if present, otherwise use centra-logo-dark.png
let sourceLogo = path.join(rootDir, 'public/centra-logo-dark.png');
const svgPath = path.join(rootDir, 'public/logo-on-dark.svg');
const highResTemp = '/tmp/centra_dark_logo_highres.png';

if (fs.existsSync(svgPath)) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  const match = svg.match(/href="data:image\/png;base64,([^"]+)"/);
  if (match) {
    fs.writeFileSync(highResTemp, Buffer.from(match[1], 'base64'));
    sourceLogo = highResTemp;
  }
}

// 1. Android Launcher Icons (mipmap-*)
// Safe-zone padding of 22% means the logo takes (1 - 2 * 0.22) = 56% of the canvas.
const densities = [
  { name: 'mdpi', size: 48, fgSize: 108 },
  { name: 'hdpi', size: 72, fgSize: 162 },
  { name: 'xhdpi', size: 96, fgSize: 216 },
  { name: 'xxhdpi', size: 144, fgSize: 324 },
  { name: 'xxxhdpi', size: 192, fgSize: 432 }
];

for (const d of densities) {
  const dir = path.join(rootDir, `android/app/src/main/res/mipmap-${d.name}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const logoSize = Math.round(d.size * 0.56);
  const fgLogoSize = Math.round(d.fgSize * 0.56);

  // 1. ic_launcher.png (#000000 black background with centered logo)
  const tempSmall = `/tmp/centra_temp_${d.name}.png`;
  execSync(`sips -z ${logoSize} ${logoSize} "${sourceLogo}" --out "${tempSmall}"`);
  execSync(`sips -p ${d.size} ${d.size} --padColor 000000 "${tempSmall}" --out "${path.join(dir, 'ic_launcher.png')}"`);

  // 2. ic_launcher_round.png (Same on black background)
  execSync(`cp "${path.join(dir, 'ic_launcher.png')}" "${path.join(dir, 'ic_launcher_round.png')}"`);

  // 3. ic_launcher_foreground.png (Transparent background with logo centered)
  const tempFgSmall = `/tmp/centra_fg_temp_${d.name}.png`;
  execSync(`sips -z ${fgLogoSize} ${fgLogoSize} "${sourceLogo}" --out "${tempFgSmall}"`);
  execSync(`sips -p ${d.fgSize} ${d.fgSize} "${tempFgSmall}" --out "${path.join(dir, 'ic_launcher_foreground.png')}"`);

  console.log(`Generated black launcher icons for mipmap-${d.name}`);
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
