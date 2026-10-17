/**
 * Knolect Extension Packaging Script
 * Validates extension manifest and files, then creates a clean store-ready ZIP archive
 * for Chrome Web Store Developer Dashboard submission.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Knolect Chrome Extension Packaging Tool ===\n');

const ROOT_DIR = path.resolve(__dirname, '..');
const EXT_DIR = path.join(ROOT_DIR, 'extension');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const MANIFEST_PATH = path.join(EXT_DIR, 'manifest.json');

// 1. Verify manifest.json exists
if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('[ERROR] manifest.json not found at:', MANIFEST_PATH);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
console.log(`[PASS] Loaded manifest.json for: ${manifest.name} (v${manifest.version})`);

// 2. Validate Manifest V3 properties
if (manifest.manifest_version !== 3) {
  console.error('[ERROR] manifest_version must be 3 for Chrome Web Store submission');
  process.exit(1);
}

// 3. Verify all referenced files
const requiredFiles = [];

// Icons
if (manifest.icons) {
  Object.values(manifest.icons).forEach(iconPath => requiredFiles.push(iconPath));
}

// Action
if (manifest.action) {
  if (manifest.action.default_popup) requiredFiles.push(manifest.action.default_popup);
  if (manifest.action.default_icon) {
    Object.values(manifest.action.default_icon).forEach(iconPath => requiredFiles.push(iconPath));
  }
}

// Background
if (manifest.background && manifest.background.service_worker) {
  requiredFiles.push(manifest.background.service_worker);
}

// Options UI
if (manifest.options_ui && manifest.options_ui.page) {
  requiredFiles.push(manifest.options_ui.page);
}

// Content scripts
if (manifest.content_scripts) {
  manifest.content_scripts.forEach(cs => {
    (cs.js || []).forEach(f => requiredFiles.push(f));
    (cs.css || []).forEach(f => requiredFiles.push(f));
  });
}

let missingFiles = 0;
requiredFiles.forEach(relPath => {
  const absPath = path.join(EXT_DIR, relPath);
  if (!fs.existsSync(absPath)) {
    console.error(`[FAIL] Missing referenced file: ${relPath}`);
    missingFiles++;
  } else {
    console.log(`[PASS] Verified asset: ${relPath}`);
  }
});

if (missingFiles > 0) {
  console.error(`\n[ERROR] Packaging aborted: ${missingFiles} referenced file(s) missing.`);
  process.exit(1);
}

// 4. Ensure dist/ directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// 5. Target ZIP name
const zipName = `knolect-extension-v${manifest.version}.zip`;
const zipPath = path.join(DIST_DIR, zipName);

// Remove old zip if present
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// 6. Build the zip archive
// Copy release files to a staging directory to exclude developer tools (like generate_icons.js)
const STAGING_DIR = path.join(DIST_DIR, '.staging');
if (fs.existsSync(STAGING_DIR)) {
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });
}
fs.mkdirSync(STAGING_DIR, { recursive: true });

// Copy directories and manifest
const itemsToInclude = [
  'manifest.json',
  'assets',
  'background',
  'content',
  'dashboard',
  'popup',
  'storage',
  'utils'
];

itemsToInclude.forEach(item => {
  const src = path.join(EXT_DIR, item);
  const dest = path.join(STAGING_DIR, item);
  if (fs.existsSync(src)) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
});

console.log('\n[INFO] Packaging clean release files into ZIP archive...');

try {
  // Use PowerShell Compress-Archive on Windows
  const psCommand = `Compress-Archive -Path "${STAGING_DIR}/*" -DestinationPath "${zipPath}" -Force`;
  execSync(`powershell -NoProfile -Command "${psCommand}"`, { stdio: 'inherit' });

  // Clean staging
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });

  const stat = fs.statSync(zipPath);
  console.log(`\n=== Packaging Succeeded! ===`);
  console.log(`Archive: ${zipPath}`);
  console.log(`Size: ${(stat.size / 1024).toFixed(1)} KB`);
  console.log(`Ready for Chrome Web Store Developer Dashboard upload.`);
} catch (err) {
  console.error('[ERROR] Failed to package zip archive:', err.message);
  process.exit(1);
}
