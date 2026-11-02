import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const githubUser = 'iqbalhasanshanto-dev';
const repoName = 'fintech-centra';
const branch = 'main';

// 1. Read versions.json
const versionsPath = path.join(rootDir, 'versions.json');
let versions = { android: '4.1.1', ios: '1.0.0', web: '1.0.0' };
if (fs.existsSync(versionsPath)) {
  try {
    versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
  } catch (e) {
    console.warn('Warning: Failed to parse versions.json, using defaults', e);
  }
}

// 2. Parse CLI arguments
const rawArg1 = process.argv[2]?.trim().toLowerCase();
const rawArg2 = process.argv[3]?.trim();

let platform = 'android';
let requestedVersion = null;

if (rawArg1 === 'android' || rawArg1 === 'ios' || rawArg1 === 'web') {
  platform = rawArg1;
  requestedVersion = rawArg2 || null;
} else if (rawArg1 && /^\d+\.\d+\.\d+/.test(rawArg1)) {
  platform = 'android';
  requestedVersion = rawArg1;
}

const currentVersion = versions[platform] || '1.0.0';
const version = requestedVersion || currentVersion;
versions[platform] = version;
fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2) + '\n', 'utf8');
console.log(`✅ Synced versions.json [${platform}] -> ${version}`);

// Also sync root package.json version with android track
const pkgPath = path.join(rootDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.version = versions.android;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

// Ensure platform release directory exists
const targetRelDir = path.join(rootDir, `releases/${platform}`);
if (!fs.existsSync(targetRelDir)) {
  fs.mkdirSync(targetRelDir, { recursive: true });
}

let releaseFileName = '';
let releaseFilePath = '';

if (platform === 'android') {
  // Update android/app/build.gradle
  const gradlePath = path.join(rootDir, 'android/app/build.gradle');
  if (fs.existsSync(gradlePath)) {
    let content = fs.readFileSync(gradlePath, 'utf8');
    content = content.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);
    fs.writeFileSync(gradlePath, content, 'utf8');
    console.log(`✅ Synced android/app/build.gradle (versionName) -> ${version}`);
  }

  releaseFileName = `Centra-v${version}.apk`;
  releaseFilePath = path.join(targetRelDir, releaseFileName);

  const apkSource = path.join(rootDir, 'android/app/build/outputs/apk/debug/app-debug.apk');
  if (fs.existsSync(apkSource)) {
    fs.copyFileSync(apkSource, releaseFilePath);
    console.log(`✅ Copied app-debug.apk -> releases/android/${releaseFileName}`);
  } else if (!fs.existsSync(releaseFilePath)) {
    console.error(`❌ Error: APK build not found at:\n   ${apkSource}\n   nor at ${releaseFilePath}`);
    console.error('\n👉 Please run the build command first:');
    console.error('   npm run build && npx cap sync android && cd android && ./gradlew assembleDebug && cd ..\n');
    process.exit(1);
  }
} else if (platform === 'ios') {
  // Update Xcode project marketing version
  const pbxPath = path.join(rootDir, 'ios/App/App.xcodeproj/project.pbxproj');
  if (fs.existsSync(pbxPath)) {
    let content = fs.readFileSync(pbxPath, 'utf8');
    content = content.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);
    fs.writeFileSync(pbxPath, content, 'utf8');
    console.log(`✅ Synced ios/App/App.xcodeproj/project.pbxproj -> ${version}`);
  }

  releaseFileName = `Centra-iOS-v${version}.zip`;
  releaseFilePath = path.join(targetRelDir, releaseFileName);

  console.log(`📦 Packaging iOS release bundle -> releases/ios/${releaseFileName}...`);
  execSync(`zip -q -r "${releaseFilePath}" ios public/manifest.json -x "*.DS_Store" "*build/*" "*/DerivedData/*"`, { cwd: rootDir });
  console.log(`✅ Packaged releases/ios/${releaseFileName}`);
} else if (platform === 'web') {
  releaseFileName = `Centra-Web-v${version}.zip`;
  releaseFilePath = path.join(targetRelDir, releaseFileName);

  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(distDir)) {
    console.log('📦 Building web production bundle (npm run build)...');
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  }

  console.log(`📦 Packaging Web/Desktop PWA distribution -> releases/web/${releaseFileName}...`);
  execSync(`cd dist && zip -q -r "${releaseFilePath}" . -x "*.DS_Store"`, { cwd: rootDir });
  console.log(`✅ Packaged releases/web/${releaseFileName}`);
}

// Compute file statistics & SHA-256
const fileBuffer = fs.readFileSync(releaseFilePath);
const fileSize = fileBuffer.length;
const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

const rawUrl = `https://raw.githubusercontent.com/${githubUser}/${repoName}/${branch}/releases/${platform}/${releaseFileName}`;
const directDownloadUrl = `https://github.com/${githubUser}/${repoName}/raw/${branch}/releases/${platform}/${releaseFileName}`;

// Update master releases/README.md with new checksum/version
const masterReadmePath = path.join(rootDir, 'releases/README.md');
if (fs.existsSync(masterReadmePath)) {
  let content = fs.readFileSync(masterReadmePath, 'utf8');
  if (platform === 'android') {
    content = content.replace(/\| \*\*🤖 Android\*\* \| \*\*`v[^`]+`\*\* \|/g, `| **🤖 Android** | **\`v${version}\`** |`);
    content = content.replace(
      /\| \*\*Android\*\* \| `Centra-v[^`]+\.apk` \| [0-9.]+ MB \| `[a-f0-9]{64}` \|/g,
      `| **Android** | \`${releaseFileName}\` | ${fileSizeMB} MB | \`${sha256}\` |`
    );
  } else if (platform === 'ios') {
    content = content.replace(/\| \*\*🍏 iOS\*\* \| \*\*`v[^`]+`\*\* \|/g, `| **🍏 iOS** | **\`v${version}\`** |`);
    content = content.replace(
      /\| \*\*iOS\*\* \| `Centra-iOS-v[^`]+\.zip` \| [0-9.]+ MB \| `[a-f0-9]{64}` \|/g,
      `| **iOS** | \`${releaseFileName}\` | ${fileSizeMB} MB | \`${sha256}\` |`
    );
  } else if (platform === 'web') {
    content = content.replace(/\| \*\*💻 Web \/ Desktop\*\* \| \*\*`v[^`]+`\*\* \|/g, `| **💻 Web / Desktop** | **\`v${version}\`** |`);
    content = content.replace(
      /\| \*\*Web\*\* \| `Centra-Web-v[^`]+\.zip` \| [0-9.]+ MB \| `[a-f0-9]{64}` \|/g,
      `| **Web** | \`${releaseFileName}\` | ${fileSizeMB} MB | \`${sha256}\` |`
    );
  }
  fs.writeFileSync(masterReadmePath, content, 'utf8');
  console.log(`✅ Synced releases/README.md -> ${platform} v${version}`);
}

console.log('='.repeat(70));
console.log(`🎉 Centra Release Prepared: [${platform.toUpperCase()}] v${version}`);
console.log('='.repeat(70));
console.log(`📦 Artifact:     releases/${platform}/${releaseFileName}`);
console.log(`⚖️  Size:         ${fileSizeMB} MB (${fileSize.toLocaleString()} bytes)`);
console.log(`🔑 SHA-256:      ${sha256}`);
console.log(`🔗 Raw URL:      ${rawUrl}`);
console.log(`📥 Download:     ${directDownloadUrl}`);
console.log('='.repeat(70));
