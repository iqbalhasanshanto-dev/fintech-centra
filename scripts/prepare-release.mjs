import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const githubUser = 'iqbalhasanshanto-dev';
const repoName = 'fintech-centra';
const branch = 'main';

// --- Helper Functions for Semver ---
function parseSemver(v) {
  const [core] = v.split('-');
  const parts = core.split('.').map(n => parseInt(n, 10) || 0);
  return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
}

function compareSemver(v1, v2) {
  const s1 = parseSemver(v1);
  const s2 = parseSemver(v2);
  if (s1.major !== s2.major) return s2.major - s1.major;
  if (s1.minor !== s2.minor) return s2.minor - s1.minor;
  return s2.patch - s1.patch;
}

function getAllReleases(releasesDir) {
  if (!fs.existsSync(releasesDir)) return [];
  const files = fs.readdirSync(releasesDir);
  const releases = [];
  for (const file of files) {
    const match = file.match(/^Centra-v(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)(?:-debug)?\.apk$/);
    if (match) {
      const v = match[1];
      const filePath = path.join(releasesDir, file);
      const stat = fs.statSync(filePath);
      const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
      releases.push({
        version: v,
        fileName: file,
        sizeMB,
      });
    }
  }
  releases.sort((a, b) => compareSemver(a.version, b.version));
  return releases;
}

function syncReleasesTable(content, newVersion, newDirectUrl, newRawUrl, newSizeMB, defaultHighlights) {
  let tableHeader = '| Version | Channel | Download / Release Record | Size | Highlights |\n|:---|:---|:---|:---|:---|';
  if (!content.includes(tableHeader)) {
    tableHeader = '| Version | Channel | One-Click Direct Download | Size | Highlights |\n|:---|:---|:---|:---|:---|';
  }
  if (!content.includes(tableHeader)) return content;

  const [beforeTable, afterHeader] = content.split(tableHeader + '\n');
  const lines = afterHeader.split('\n');
  const tableRows = [];
  let remainderIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('| **`v')) {
      tableRows.push(lines[i]);
    } else {
      remainderIndex = i;
      break;
    }
  }

  const remainder = remainderIndex !== -1 ? lines.slice(remainderIndex).join('\n') : '';
  const existingIdx = tableRows.findIndex(r => r.includes(`| **\`v${newVersion}\`** |`));

  let finalRows = [];
  if (existingIdx !== -1) {
    // Current version already exists - normalize channel statuses and labels across all rows
    finalRows = tableRows.map((r, idx) => {
      if (idx === existingIdx) {
        let row = r.replace(/\| (🟢 Latest|⚪ Previous|📦 Archive) \|/, '| 🟢 Latest |');
        row = row.replace(/\|\s*[0-9.]+\s*MB\s*\|/, `| ${newSizeMB} MB |`);
        row = row.replace(/\[\*\*📦 Download APK\*\*\]/, '[**📲 Download APK**]');
        return row;
      }
      const prevIdx = existingIdx === 0 ? 1 : 0;
      if (idx === prevIdx) {
        let row = r.replace(/\| (🟢 Latest|⚪ Previous|📦 Archive) \|/, '| ⚪ Previous |');
        row = row.replace(/\[\*\*📲 Download APK\*\*\]/, '[**📦 Download APK**]');
        return row;
      } else {
        let row = r.replace(/\| (🟢 Latest|⚪ Previous|📦 Archive) \|/, '| 📦 Archive |');
        row = row.replace(/\[\*\*📲 Download APK\*\*\]/, '[**📦 Download APK**]');
        return row;
      }
    });
  } else {
    // 1. First convert all existing "| ⚪ Previous |" rows to "| 📦 Archive |"
    let updated = tableRows.map(r => {
      if (r.includes('| ⚪ Previous |')) {
        let row = r.replace('| ⚪ Previous |', '| 📦 Archive |');
        const vMatch = r.match(/\| \*\*`v([^`]+)`\*\* \|/);
        if (vMatch) {
          const v = vMatch[1];
          row = row.replace(
            /\[\*\*📦 Download APK\*\*\]\([^)]+\) · \[Mirror\]\([^)]+\)/,
            `[**🏷️ Source Tag**](https://github.com/${githubUser}/${repoName}/tree/v${v}) · [Notes](CHANGELOG.md)`
          );
        }
        return row;
      }
      return r;
    });

    // 2. Then convert the old "| 🟢 Latest |" row to "| ⚪ Previous |" and change its download label from "📲 Download APK" to "📦 Download APK"
    updated = updated.map(r => {
      if (r.includes('| 🟢 Latest |')) {
        let row = r
          .replace('| 🟢 Latest |', '| ⚪ Previous |')
          .replace('[**📲 Download APK**]', '[**📦 Download APK**]');
        row = row.replace(/-debug\.apk/g, '.apk');
        return row;
      }
      return r;
    });

    // 3. Finally insert the new v${version} row at the top as "| 🟢 Latest |" with "📲 Download APK"
    const newRow = `| **\`v${newVersion}\`** | 🟢 Latest | [**📲 Download APK**](${newDirectUrl}) · [Mirror](${newRawUrl}) | ${newSizeMB} MB | ${defaultHighlights} |`;
    finalRows = [newRow, ...updated];
  }

  return beforeTable + tableHeader + '\n' + finalRows.join('\n') + '\n' + remainder;
}

// 1. Read / Update package.json version
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const cliVersionArg = process.argv[2];

let version = pkg.version;
if (cliVersionArg && cliVersionArg.trim() && cliVersionArg !== pkg.version) {
  version = cliVersionArg.trim();
  pkg.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`✅ Synced package.json -> ${version}`);
}

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

// 4. Target release path & copy APK (non-debug clean filename)
const targetFileName = `Centra-v${version}.apk`;
const targetPath = path.join(releasesDir, targetFileName);
fs.copyFileSync(apkSource, targetPath);

// 5. Compute file statistics & SHA-256
const fileBuffer = fs.readFileSync(targetPath);
const fileSize = fileBuffer.length;
const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

const rawUrl = `https://raw.githubusercontent.com/${githubUser}/${repoName}/${branch}/releases/${targetFileName}`;
const directDownloadUrl = `https://github.com/${githubUser}/${repoName}/raw/${branch}/releases/${targetFileName}`;

// 6. Synchronize version across codebase
// a. src/utils/version.ts
const versionTsPath = path.join(rootDir, 'src/utils/version.ts');
fs.writeFileSync(versionTsPath, `export const APP_VERSION = '${version}';\n\n`, 'utf8');
console.log(`✅ Synced src/utils/version.ts -> ${version}`);

// b. src-tauri/tauri.conf.json
const tauriConfPath = path.join(rootDir, 'src-tauri/tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  let content = fs.readFileSync(tauriConfPath, 'utf8');
  content = content.replace(/"version":\s*"[^"]+"/, `"version": "${version}"`);
  fs.writeFileSync(tauriConfPath, content, 'utf8');
  console.log(`✅ Synced src-tauri/tauri.conf.json -> ${version}`);
}

// c. src-tauri/Cargo.toml
const cargoPath = path.join(rootDir, 'src-tauri/Cargo.toml');
if (fs.existsSync(cargoPath)) {
  let content = fs.readFileSync(cargoPath, 'utf8');
  content = content.replace(/(\[package\][\s\S]*?version\s*=\s*)"[^"]+"/, `$1"${version}"`);
  fs.writeFileSync(cargoPath, content, 'utf8');
  console.log(`✅ Synced src-tauri/Cargo.toml -> ${version}`);
}

// d. android/app/build.gradle
const gradlePath = path.join(rootDir, 'android/app/build.gradle');
if (fs.existsSync(gradlePath)) {
  let content = fs.readFileSync(gradlePath, 'utf8');
  content = content.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);
  fs.writeFileSync(gradlePath, content, 'utf8');
  console.log(`✅ Synced android/app/build.gradle (versionName) -> ${version}`);
}

// 7. Discover all releases
const allReleases = getAllReleases(releasesDir);
const prev = allReleases.find(r => r.version !== version) || allReleases[1] || { version, fileName: targetFileName, sizeMB: fileSizeMB };

// Default release highlights
const defaultReleaseHighlights = 'Edit transaction date & Figma category picker, 52px input alignment, once-per-month retention notifications, centered toasts, all-categories activity filter, instant home back exit';

// 8. Update README.md
const readmePath = path.join(rootDir, 'README.md');
if (fs.existsSync(readmePath)) {
  let content = fs.readFileSync(readmePath, 'utf8');

  // Top Release badge
  content = content.replace(
    /\[!\[Latest Release [^\]]+\]\(https:\/\/img\.shields\.io\/badge\/Release-[^)]+\)\]\(#-releases--version-history-table-download-any-version\)/,
    `[![Latest Release v${version}](https://img.shields.io/badge/Release-v${version}-C6FF3D.svg?style=flat-square&labelColor=000000&color=C6FF3D)](#-releases--version-history-table-download-any-version)`
  );

  // Hero Download Callout
  const heroRegex = /<!-- Hero Download Action Callout -->[\s\S]*?<\/table>/;
  const newHero = `<!-- Hero Download Action Callout -->
<table>
  <tr>
    <td align="center" style="padding: 18px; background-color: #0d1117; border: 1px solid #30363d; border-radius: 14px;">
      <b>⚡ Instant Direct Downloads (No App Store / Sign-Up Required)</b>
      <br /><br />
      <a href="https://github.com/${githubUser}/${repoName}/raw/${branch}/releases/${targetFileName}">
        <img src="https://img.shields.io/badge/📲_Download_Android_APK-v${version}_(Latest_Stable,_${fileSizeMB}_MB)-C6FF3D?style=for-the-badge&logo=android&logoColor=000000&labelColor=121212" alt="Download Centra v${version} Android APK" />
      </a>
      &nbsp;
      <a href="https://github.com/${githubUser}/${repoName}/raw/${branch}/releases/${prev.fileName}">
        <img src="https://img.shields.io/badge/📦_Download_Android_APK-v${prev.version}_(Previous_Release,_${prev.sizeMB}_MB)-3B82F6?style=for-the-badge&logo=android&logoColor=ffffff&labelColor=121212" alt="Download Centra v${prev.version} Android APK" />
      </a>
      &nbsp;
      <a href="#-desktop--mobile-installation-guide">
        <img src="https://img.shields.io/badge/💻_Desktop_&_Mobile-Installation_Guide-white?style=for-the-badge&logo=desktop&logoColor=000000&labelColor=121212" alt="Build / Run on Desktop" />
      </a>
      <br /><br />
      <b>👉 Direct One-Click APK Download (Android & Desktop):</b> <a href="https://github.com/${githubUser}/${repoName}/raw/${branch}/releases/${targetFileName}">Download Centra v${version} APK (${fileSizeMB} MB)</a> | <a href="https://github.com/${githubUser}/${repoName}/raw/${branch}/releases/${prev.fileName}">Download Centra v${prev.version} APK (${prev.sizeMB} MB)</a>
    </td>
  </tr>
</table>`;
  content = content.replace(heroRegex, newHero);

  // Android Phone Installation Link
  content = content.replace(
    /1\.\s+Tap the \[.*?Download Centra v[0-9.]+.*?APK.*?\]\([^)]+\) button above\./,
    `1. Tap the [**📲 Download Centra v${version} APK**](https://github.com/${githubUser}/${repoName}/raw/${branch}/releases/${targetFileName}) button above.`
  );

  // Desktop ADB commands
  content = content.replace(
    /adb install -r Centra-v[0-9.]+(-[a-zA-Z0-9.]+)?(-debug)?\.apk/g,
    `adb install -r ${targetFileName}`
  );
  content = content.replace(
    /adb connect 127\.0\.0\.1:58526 && adb install Centra-v[0-9.]+(-[a-zA-Z0-9.]+)?(-debug)?\.apk/g,
    `adb connect 127.0.0.1:58526 && adb install ${targetFileName}`
  );

  // SHA-256 Checksum Verification section
  content = content.replace(
    /shasum -a 256 releases\/Centra-v[0-9.]+(-[a-zA-Z0-9.]+)?(-debug)?\.apk/g,
    `shasum -a 256 releases/${targetFileName}`
  );
  content = content.replace(
    /CertUtil -hashfile releases\\Centra-v[0-9.]+(-[a-zA-Z0-9.]+)?(-debug)?\.apk SHA256/g,
    `CertUtil -hashfile releases\\${targetFileName} SHA256`
  );
  content = content.replace(
    /\*\*Expected SHA-256 Hash for v[0-9.]+(-[a-zA-Z0-9.]+)?\*\*:\s*```text\s*[a-f0-9]{64}\s*```/,
    `**Expected SHA-256 Hash for v${version}**:\n\`\`\`text\n${sha256}\n\`\`\``
  );

  // Releases tree in Repository Architecture Tree
  const treeBlockRegex = /(├── releases\/[^\n]*\n)([\s\S]*?)(│\s*└── README\.md)/;
  const treeEntries = allReleases.map(r => `│   ├── ${r.fileName}`).join('\n') + '\n';
  content = content.replace(treeBlockRegex, `$1${treeEntries}$3`);

  // Releases Table
  content = syncReleasesTable(
    content,
    version,
    directDownloadUrl,
    rawUrl,
    fileSizeMB,
    defaultReleaseHighlights
  );

  // Release naming convention example
  content = content.replace(
    /- Example: Centra-v[0-9.]+(-[a-zA-Z0-9.]+)?(-debug)?\.apk,\s*Centra-v[0-9.]+(-[a-zA-Z0-9.]+)?(-debug)?\.apk/,
    `- Example: Centra-v${prev.version}.apk, Centra-v${version}.apk`
  );

  // Maintainer guide package.json example
  content = content.replace(
    /1\.\s+\*\*Bump Version\*\*:\s+Update\s+"version"\s+in\s+\[`package\.json`\]\(\.\.\/package\.json\)\s+\(e\.g\.\s*"version":\s*"[0-9.]+"\)\./,
    `1. **Bump Version**: Update \`"version"\` in [\`package.json\`](../package.json) (e.g. \`"version": "${version}"\`).`
  );

  // Checksum <details> block
  const detailsHeader = '<summary><b>🔒 View SHA-256 Checksums & Verification Commands</b></summary>\n\n';
  const checksumEntryRegex = new RegExp(`- \\*\\*v${version} \\(\\\`${targetFileName}\\\`\\)\\*\\*:\\s*\`[a-f0-9]{64}\``);
  if (checksumEntryRegex.test(content)) {
    content = content.replace(checksumEntryRegex, `- **v${version} (\`${targetFileName}\`)**: \`${sha256}\``);
  } else if (content.includes(detailsHeader)) {
    content = content.replace(detailsHeader, detailsHeader + `- **v${version} (\`${targetFileName}\`)**: \`${sha256}\`\n`);
  }

  // Checksum footer verification hint inside <details>
  content = content.replace(
    /Verify on macOS\/Linux \(`shasum -a 256 releases\/Centra-v[^`]+`\) or Windows \(`CertUtil -hashfile releases\\Centra-v[^`]+ SHA256`\)\./,
    `Verify on macOS/Linux (\`shasum -a 256 releases/${targetFileName}\`) or Windows (\`CertUtil -hashfile releases\\${targetFileName} SHA256\`).`
  );

  fs.writeFileSync(readmePath, content, 'utf8');
  console.log(`✅ Synced README.md -> v${version}`);
}

// 9. Update releases/README.md
const releasesReadmePath = path.join(rootDir, 'releases/README.md');
if (fs.existsSync(releasesReadmePath)) {
  let content = fs.readFileSync(releasesReadmePath, 'utf8');

  // Releases Table
  content = syncReleasesTable(
    content,
    version,
    directDownloadUrl,
    rawUrl,
    fileSizeMB,
    defaultReleaseHighlights
  );

  // Release naming convention example
  content = content.replace(
    /- Example: Centra-v[0-9.]+(-[a-zA-Z0-9.]+)?(-debug)?\.apk,\s*Centra-v[0-9.]+(-[a-zA-Z0-9.]+)?(-debug)?\.apk/,
    `- Example: Centra-v${prev.version}.apk, Centra-v${version}.apk`
  );

  // Maintainer guide package.json example
  content = content.replace(
    /1\.\s+\*\*Bump Version\*\*:\s+Update\s+"version"\s+in\s+\[`package\.json`\]\(\.\.\/package\.json\)\s+\(e\.g\.\s*"version":\s*"[0-9.]+"\)\./,
    `1. **Bump Version**: Update \`"version"\` in [\`package.json\`](../package.json) (e.g. \`"version": "${version}"\`).`
  );

  // Checksum entry in <details>
  const detailsHeader = '<summary><b>🔒 View SHA-256 Checksums & Verification Commands</b></summary>\n\n';
  const checksumEntryRegex = new RegExp(`- \\*\\*v${version} \\(\\\`${targetFileName}\\\`\\)\\*\\*:\\s*\`[a-f0-9]{64}\``);
  if (checksumEntryRegex.test(content)) {
    content = content.replace(checksumEntryRegex, `- **v${version} (\`${targetFileName}\`)**: \`${sha256}\``);
  } else if (content.includes(detailsHeader)) {
    content = content.replace(detailsHeader, detailsHeader + `- **v${version} (\`${targetFileName}\`)**: \`${sha256}\`\n`);
  }

  // Checksum footer verification command inside <details>
  content = content.replace(
    /Verify on macOS\/Linux \(`shasum -a 256 releases\/Centra-v[^`]+`\) or Windows \(`CertUtil -hashfile releases\\Centra-v[^`]+ SHA256`\)\./,
    `Verify on macOS/Linux (\`shasum -a 256 releases/${targetFileName}\`) or Windows (\`CertUtil -hashfile releases\\${targetFileName} SHA256\`).`
  );

  // Verification instructions section
  content = content.replace(
    /shasum -a 256 releases\/Centra-v[0-9.]+(-[a-zA-Z0-9.]+)?(-debug)?\.apk/g,
    `shasum -a 256 releases/${targetFileName}`
  );
  content = content.replace(
    /CertUtil -hashfile releases\\Centra-v[0-9.]+(-[a-zA-Z0-9.]+)?(-debug)?\.apk SHA256/g,
    `CertUtil -hashfile releases\\${targetFileName} SHA256`
  );

  fs.writeFileSync(releasesReadmePath, content, 'utf8');
  console.log(`✅ Synced releases/README.md -> v${version}`);
}

console.log('='.repeat(70));
console.log(`🎉 Centra APK Release Prepared & All Docs Synced: v${version}`);
console.log('='.repeat(70));
console.log(`📁 Source:       ${apkSource}`);
console.log(`📦 Destination:  releases/${targetFileName}`);
console.log(`⚖️  Size:         ${fileSizeMB} MB (${fileSize.toLocaleString()} bytes)`);
console.log(`🔑 SHA-256:      ${sha256}`);
console.log(`🔗 Raw URL:      ${rawUrl}`);
console.log('='.repeat(70));
console.log('\n📋 Markdown row in inventory tables:\n');
console.log(`| **\`v${version}\`** | 🟢 Latest | [**📲 Download APK**](${directDownloadUrl}) · [Mirror](${rawUrl}) | ${fileSizeMB} MB | ${defaultReleaseHighlights} |`);
console.log('\n📋 Checksum block entry:\n');
console.log(`- **v${version} (\`${targetFileName}\`)**: \`${sha256}\``);
console.log('\n' + '='.repeat(70));
