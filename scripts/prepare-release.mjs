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

const getVer = (val) => (typeof val === 'object' && val?.version ? val.version : val);
const currentVersion = getVer(versions[platform]) || '1.0.0';
const version = requestedVersion || currentVersion;

if (typeof versions[platform] === 'object' && versions[platform] !== null) {
  versions[platform].version = version;
  if (platform === 'android') {
    versions.android.versionCode = 13;
    versions.android.artifactPath = `releases/android/Centra-v${version}.apk`;
  } else if (platform === 'web') {
    versions.web.updatedAt = '2026-03-30';
  }
} else {
  versions[platform] = version;
}
fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2) + '\n', 'utf8');
const publicVersionsPath = path.join(rootDir, 'public/versions.json');
try {
  fs.writeFileSync(publicVersionsPath, JSON.stringify(versions, null, 2) + '\n', 'utf8');
} catch {}
console.log(`✅ Synced versions.json [${platform}] -> ${version}`);

// Also sync root package.json version with android track
const pkgPath = path.join(rootDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.version = getVer(versions.android);
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

// Ensure platform release directory exists
const targetRelDir = path.join(rootDir, `releases/${platform}`);
if (!fs.existsSync(targetRelDir)) {
  fs.mkdirSync(targetRelDir, { recursive: true });
}

let releaseFileName = '';
let releaseFilePath = '';
let fileSize = 0;
let fileSizeMB = '0.00';
let sha256 = '';

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

  const apkReleaseSource = path.join(rootDir, 'android/app/build/outputs/apk/release/app-release.apk');
  const apkReleaseUnsigned = path.join(rootDir, 'android/app/build/outputs/apk/release/app-release-unsigned.apk');
  const apkDebugSource = path.join(rootDir, 'android/app/build/outputs/apk/debug/app-debug.apk');
  const apkSource = fs.existsSync(apkReleaseSource) ? apkReleaseSource : fs.existsSync(apkReleaseUnsigned) ? apkReleaseUnsigned : apkDebugSource;

  if (fs.existsSync(apkSource)) {
    fs.copyFileSync(apkSource, releaseFilePath);
    console.log(`✅ Copied ${path.basename(apkSource)} -> releases/android/${releaseFileName}`);
  } else if (!fs.existsSync(releaseFilePath)) {
    console.error(`❌ Error: APK build not found at:\n   ${apkSource}\n   nor at ${releaseFilePath}`);
    console.error('\n👉 Please run the build command first:');
    console.error('   npm run build && npx cap sync android && cd android && ./gradlew assembleRelease && cd ..\n');
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(releaseFilePath);
  fileSize = fileBuffer.length;
  fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
  sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Update releases/android/README.md
  const androidReadmePath = path.join(rootDir, 'releases/android/README.md');
  if (fs.existsSync(androidReadmePath)) {
    let content = fs.readFileSync(androidReadmePath, 'utf8');
    content = content.replace(/\| \*\*`v[0-9.]+`\*\* \| 🟢 Latest \|.*?\|/g, (match) => {
      return match.replace(/Centra-v[0-9.]+\.apk/g, releaseFileName).replace(/[0-9.]+ MB/, `${fileSizeMB} MB`);
    });
    content = content.replace(/- \*\*v[0-9.]+ \(`Centra-v[0-9.]+\.apk`\)\*\*: `[a-f0-9]{64}`/, `- **v${version} (\`${releaseFileName}\`)\**: \`${sha256}\``);
    content = content.replace(/shasum -a 256 releases\/android\/Centra-v[0-9.]+\.apk/, `shasum -a 256 releases/android/${releaseFileName}`);
    fs.writeFileSync(androidReadmePath, content, 'utf8');
    console.log(`✅ Synced releases/android/README.md -> v${version}`);
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

  console.log('📦 Building web assets & syncing with iOS native workspace...');
  execSync('npm run build && npx cap sync ios', { cwd: rootDir, stdio: 'inherit' });

  releaseFileName = `Centra-v${version}.ipa`;
  releaseFilePath = path.join(targetRelDir, releaseFileName);

  // Check if xcodebuild is available
  let hasXcodebuild = false;
  try {
    execSync('which xcodebuild', { stdio: 'ignore' });
    hasXcodebuild = true;
  } catch {
    hasXcodebuild = false;
  }

  if (hasXcodebuild) {
    console.log(`🔨 Compiling iOS Release IPA via xcodebuild -> releases/ios/${releaseFileName}...`);
    const xcodeCmd = `
      set -e
      cd ios/App
      xcodebuild -project App.xcodeproj \\
        -scheme App \\
        -configuration Release \\
        -sdk iphoneos \\
        -derivedDataPath build \\
        CODE_SIGN_IDENTITY="" \\
        CODE_SIGNING_REQUIRED=NO \\
        CODE_SIGNING_ALLOWED=NO \\
        clean build
      mkdir -p Payload
      cp -R build/Build/Products/Release-iphoneos/App.app Payload/
      zip -r -q "../../releases/ios/${releaseFileName}" Payload
      rm -rf Payload build
    `;
    execSync(xcodeCmd, { cwd: rootDir, stdio: 'inherit' });
    console.log(`✅ Packaged releases/ios/${releaseFileName}`);
  } else if (!fs.existsSync(releaseFilePath)) {
    console.error(`❌ xcodebuild is not available and ${releaseFilePath} does not exist.`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(releaseFilePath);
  fileSize = fileBuffer.length;
  fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
  sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Update releases/ios/README.md
  const iosReadmePath = path.join(rootDir, 'releases/ios/README.md');
  if (fs.existsSync(iosReadmePath)) {
    let content = fs.readFileSync(iosReadmePath, 'utf8');
    content = content.replace(/\| \*\*`v[0-9.]+`\*\* \| 🟢 Latest \|.*?\|/g, (match) => {
      return match.replace(/Centra-v[0-9.]+\.ipa/g, releaseFileName).replace(/[0-9.]+ MB/, `${fileSizeMB} MB`);
    });
    content = content.replace(/- \*\*v[0-9.]+ \(`Centra-v[0-9.]+\.ipa`\)\*\*: `[a-f0-9]{64}`/, `- **v${version} (\`${releaseFileName}\`)\**: \`${sha256}\``);
    content = content.replace(/shasum -a 256 releases\/ios\/Centra-v[0-9.]+\.ipa/, `shasum -a 256 releases/ios/${releaseFileName}`);
    fs.writeFileSync(iosReadmePath, content, 'utf8');
    console.log(`✅ Synced releases/ios/README.md -> v${version}`);
  }

} else if (platform === 'web') {
  console.log('📦 Building web production bundle (npm run build)...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // Ensure no lingering .zip files exist
  try {
    execSync('rm -f releases/web/*.zip releases/ios/*.zip', { cwd: rootDir, stdio: 'ignore' });
  } catch {}

  // Update releases/web/README.md
  const webReadmePath = path.join(rootDir, 'releases/web/README.md');
  if (fs.existsSync(webReadmePath)) {
    let content = fs.readFileSync(webReadmePath, 'utf8');
    content = content.replace(/\| \*\*`v[0-9.]+`\*\* \| 🟢 Latest \|/g, `| **\`v${version}\`** | 🟢 Latest |`);
    fs.writeFileSync(webReadmePath, content, 'utf8');
    console.log(`✅ Synced releases/web/README.md -> v${version}`);
  }
}

// Update master releases/README.md
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
      /\| \*\*iOS\*\* \| `Centra-v[^`]+\.ipa` \| [0-9.]+ MB \| `[a-f0-9]{64}` \|/g,
      `| **iOS** | \`${releaseFileName}\` | ${fileSizeMB} MB | \`${sha256}\` |`
    );
    content = content.replace(/Centra-v[0-9.]+\.ipa.*?Unsigned Release IPA package \([0-9.]+ MB\)/g, `${releaseFileName}   # Unsigned Release IPA package (${fileSizeMB} MB)`);
  } else if (platform === 'web') {
    content = content.replace(/\| \*\*💻 Web \/ Desktop\*\* \| \*\*`v[^`]+`\*\* \|/g, `| **💻 Web / Desktop** | **\`v${version}\`** |`);
  }
  fs.writeFileSync(masterReadmePath, content, 'utf8');
  console.log(`✅ Synced releases/README.md -> ${platform} v${version}`);
}

// Update root README.md
const rootReadmePath = path.join(rootDir, 'README.md');
if (fs.existsSync(rootReadmePath)) {
  let content = fs.readFileSync(rootReadmePath, 'utf8');
  if (platform === 'android') {
    content = content.replace(/\[!\[Android v[^\]]+\]\(https:\/\/img\.shields\.io\/badge\/Android-v[^-]+-C6FF3D\.svg/g, `[![Android v${version}](https://img.shields.io/badge/Android-v${version}-C6FF3D.svg`);
    content = content.replace(/### 🤖 Android Releases \(`v[^`]+`\)/g, `### 🤖 Android Releases (\`v${version}\`)`);
    content = content.replace(/🤖_Download_Android_APK-v[0-9.]+_.*?C6FF3D/g, `🤖_Download_Android_APK-v${version}_(Latest_Stable,_${fileSizeMB}_MB)-C6FF3D`);
    content = content.replace(/Android APK v[0-9.]+ \([0-9.]+ MB\)/g, `Android APK v${version} (${fileSizeMB} MB)`);
    content = content.replace(
      /\| \*\*Android\*\* \| `Centra-v[^`]+\.apk` \| `[a-f0-9]{64}` \|/g,
      `| **Android** | \`${releaseFileName}\` | \`${sha256}\` |`
    );
    content = content.replace(/- \*\*Android v[0-9.]+ \(`Centra-v[0-9.]+\.apk`\)\*\*: `[a-f0-9]{64}`/, `- **Android v${version} (\`${releaseFileName}\`)\**: \`${sha256}\``);
    content = content.replace(/shasum -a 256 releases\/android\/Centra-v[0-9.]+\.apk/, `shasum -a 256 releases/android/${releaseFileName}`);
  } else if (platform === 'ios') {
    content = content.replace(/\[!\[iOS v[^\]]+\]\(https:\/\/img\.shields\.io\/badge\/iOS-v[^-]+-119EFF\.svg/g, `[![iOS v${version}](https://img.shields.io/badge/iOS-v${version}-119EFF.svg`);
    content = content.replace(/### 🍏 iOS Releases \(`v[^`]+`\)/g, `### 🍏 iOS Releases (\`v${version}\`)`);
    content = content.replace(/🍏_Download_iOS_IPA-v[0-9.]+_.*?119EFF/g, `🍏_Download_iOS_IPA-v${version}_(Latest_Stable,_${fileSizeMB}_MB)-119EFF`);
    content = content.replace(/iOS IPA v[0-9.]+ \([0-9.]+ MB\)/g, `iOS IPA v${version} (${fileSizeMB} MB)`);
    content = content.replace(/\| \*\*`v[0-9.]+`\*\* \| 🟢 Latest \|.*?Download iOS IPA.*?\|/g, (match) => {
      return match.replace(/Centra-v[0-9.]+\.ipa/g, releaseFileName).replace(/[0-9.]+ MB/, `${fileSizeMB} MB`);
    });
    content = content.replace(
      /\| \*\*iOS\*\* \| `Centra-v[^`]+\.ipa` \| `[a-f0-9]{64}` \|/g,
      `| **iOS** | \`${releaseFileName}\` | \`${sha256}\` |`
    );
    content = content.replace(/- \*\*iOS v[0-9.]+ \(`Centra-v[0-9.]+\.ipa`\)\*\*: `[a-f0-9]{64}`/, `- **iOS v${version} (\`${releaseFileName}\`)\**: \`${sha256}\``);
    content = content.replace(/shasum -a 256 releases\/ios\/Centra-v[0-9.]+\.ipa/, `shasum -a 256 releases/ios/${releaseFileName}`);
  } else if (platform === 'web') {
    content = content.replace(/\[!\[Web \/ Desktop v[^\]]+\]\(https:\/\/img\.shields\.io\/badge\/Web_\/_Desktop-v[^-]+-38BDF8\.svg/g, `[![Web / Desktop v${version}](https://img.shields.io/badge/Web_/_Desktop-v${version}-38BDF8.svg`);
    content = content.replace(/### 💻 Web & Desktop Releases \(`v[^`]+`/g, `### 💻 Web & Desktop Releases (\`v${version}\``);
  }
  fs.writeFileSync(rootReadmePath, content, 'utf8');
  console.log(`✅ Synced README.md -> ${platform} v${version}`);
}

console.log('='.repeat(70));
console.log(`🎉 Centra Release Prepared: [${platform.toUpperCase()}] v${version}`);
console.log('='.repeat(70));
if (platform !== 'web') {
  const rawUrl = `https://raw.githubusercontent.com/${githubUser}/${repoName}/${branch}/releases/${platform}/${releaseFileName}`;
  const directDownloadUrl = `https://github.com/${githubUser}/${repoName}/raw/${branch}/releases/${platform}/${releaseFileName}`;
  console.log(`📦 Artifact:     releases/${platform}/${releaseFileName}`);
  console.log(`⚖️  Size:         ${fileSizeMB} MB (${fileSize.toLocaleString()} bytes)`);
  console.log(`🔑 SHA-256:      ${sha256}`);
  console.log(`🔗 Raw URL:      ${rawUrl}`);
  console.log(`📥 Download:     ${directDownloadUrl}`);
} else {
  console.log(`🌐 Distribution: Standalone PWA (Direct Browser Installation)`);
  console.log(`📦 Zero .zip files — installed directly from Chrome / Edge / Brave / Safari`);
}
console.log('='.repeat(70));
