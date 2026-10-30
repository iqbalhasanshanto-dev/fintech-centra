import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read package.json version
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version;

if (!version) {
  console.error('❌ Error: Could not find "version" in package.json');
  process.exit(1);
}

// 2. Locate built APK
const apkSource = path.join(rootDir, 'android/app/build/outputs/apk/debug/app-debug.apk');
if (!fs.existsSync(apkSource)) {
  console.error(`❌ Error: APK build not found at:\n   ${apkSource}`);
  console.error('\n👉 Please run the build command first:');
  console.error('   npm run build && npx cap sync android && cd android && ./gradlew assembleDebug && cd ..\n');
  process.exit(1);
}

// 3. Ensure releases directory exists
const releasesDir = path.join(rootDir, 'releases');
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
}

// 4. Target release path
const targetFileName = `Centra-v${version}-debug.apk`;
const targetPath = path.join(releasesDir, targetFileName);

// Copy APK
fs.copyFileSync(apkSource, targetPath);

// 5. Compute file statistics & SHA-256
const fileBuffer = fs.readFileSync(targetPath);
const fileSize = fileBuffer.length;
const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

const githubUser = 'iqbalhasanshanto-dev';
const repoName = 'fintech-centra';
const branch = 'main';
const rawUrl = `https://raw.githubusercontent.com/${githubUser}/${repoName}/${branch}/releases/${targetFileName}`;
const directRelativeUrl = `releases/${targetFileName}?raw=true`;

console.log('='.repeat(70));
console.log(`🎉 Centra APK Release Prepared: v${version}`);
console.log('='.repeat(70));
console.log(`📁 Source:       ${apkSource}`);
console.log(`📦 Destination:  releases/${targetFileName}`);
console.log(`⚖️  Size:         ${fileSizeMB} MB (${fileSize.toLocaleString()} bytes)`);
console.log(`🔑 SHA-256:      ${sha256}`);
console.log(`🔗 Raw URL:      ${rawUrl}`);
console.log('='.repeat(70));
console.log('\n📋 Ready-to-paste Markdown table row for README.md:\n');

const markdownRow = `| **\`v${version}\`** <br>*(Latest)* | 🟢 **Latest Stable** | [**⬇ Download Centra-v${version}.apk**](${directRelativeUrl}) | [Direct Mirror](${rawUrl}) | **${fileSizeMB} MB** <br>_(${fileSize.toLocaleString()} bytes)_ | \`${sha256}\` | Complete changelog in [\`CHANGELOG.md\`](CHANGELOG.md) |`;

console.log(markdownRow);
console.log('\n' + '='.repeat(70));

