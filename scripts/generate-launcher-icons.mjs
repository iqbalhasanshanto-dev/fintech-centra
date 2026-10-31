import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sourceLogo = path.join(rootDir, 'public/centra-logo-light.png');

const densities = [
  { name: 'mdpi', size: 48, fgSize: 108 },
  { name: 'hdpi', size: 72, fgSize: 162 },
  { name: 'xhdpi', size: 96, fgSize: 216 },
  { name: 'xxhdpi', size: 144, fgSize: 324 },
  { name: 'xxxhdpi', size: 192, fgSize: 432 }
];

for (const d of densities) {
  const dir = path.join(rootDir, `android/app/src/main/res/mipmap-${d.name}`);
  const logoSize = Math.round(d.size * 0.72);
  const fgLogoSize = Math.round(d.fgSize * 0.66);

  // 1. ic_launcher.png (White background with centered logo)
  const tempSmall = `/tmp/centra_temp_${d.name}.png`;
  execSync(`sips -z ${logoSize} ${logoSize} "${sourceLogo}" --out "${tempSmall}"`);
  execSync(`sips -p ${d.size} ${d.size} --padColor FFFFFF "${tempSmall}" --out "${path.join(dir, 'ic_launcher.png')}"`);

  // 2. ic_launcher_round.png (Same on white background)
  execSync(`cp "${path.join(dir, 'ic_launcher.png')}" "${path.join(dir, 'ic_launcher_round.png')}"`);

  // 3. ic_launcher_foreground.png (Transparent background with logo centered)
  const tempFgSmall = `/tmp/centra_fg_temp_${d.name}.png`;
  execSync(`sips -z ${fgLogoSize} ${fgLogoSize} "${sourceLogo}" --out "${tempFgSmall}"`);
  execSync(`sips -p ${d.fgSize} ${d.fgSize} "${tempFgSmall}" --out "${path.join(dir, 'ic_launcher_foreground.png')}"`);

  console.log(`Generated white launcher icons for mipmap-${d.name}`);
}

console.log('✅ All Android launcher icons successfully updated with clean white background and Centra light logo!');

