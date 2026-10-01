const fs = require('fs');
const path = require('path');

console.log('=== Starting Knolect Extension Verification Suite ===\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// 1. Manifest JSON Verification
const manifestPath = path.join(__dirname, 'manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.json exists');

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.manifest_version === 3, 'manifest_version is 3');
  assert(manifest.name.includes('Knolect'), 'manifest has Knolect branding');
  assert(manifest.background && manifest.background.service_worker, 'manifest has background service worker');
  assert(manifest.action && manifest.action.default_popup, 'manifest has action default_popup');
} catch (e) {
  assert(false, `manifest.json parse error: ${e.message}`);
}

// 2. Icon files verification
if (manifest && manifest.icons) {
  for (const [size, iconRelPath] of Object.entries(manifest.icons)) {
    const iconAbs = path.join(__dirname, iconRelPath);
    assert(fs.existsSync(iconAbs), `Icon file exists: ${iconRelPath}`);
    const stat = fs.statSync(iconAbs);
    assert(stat.size > 50, `Icon file is non-empty: ${iconRelPath} (${stat.size} bytes)`);
  }
}

// 3. Popup files verification
const popupHtml = path.join(__dirname, manifest.action.default_popup);
const popupCss = path.join(__dirname, 'popup', 'popup.css');
const popupJs = path.join(__dirname, 'popup', 'popup.js');

assert(fs.existsSync(popupHtml), 'popup.html exists');
assert(fs.existsSync(popupCss), 'popup.css exists');
assert(fs.existsSync(popupJs), 'popup.js exists');

// 4. Background Service Worker verification
const swPath = path.join(__dirname, manifest.background.service_worker);
assert(fs.existsSync(swPath), 'service-worker.js exists');

// 5. Content Script files verification
if (manifest && manifest.content_scripts) {
  manifest.content_scripts.forEach((cs) => {
    (cs.js || []).forEach(jsFile => {
      assert(fs.existsSync(path.join(__dirname, jsFile)), `Content script JS exists: ${jsFile}`);
    });
    (cs.css || []).forEach(cssFile => {
      assert(fs.existsSync(path.join(__dirname, cssFile)), `Content script CSS exists: ${cssFile}`);
    });
  });
}

// 6. Helper logic unit tests
const helpers = require('./utils/helpers.js');
assert(helpers.formatSeconds(1500) === '25:00', 'formatSeconds(1500) returns 25:00');
assert(helpers.formatSeconds(0) === '00:00', 'formatSeconds(0) returns 00:00');
assert(helpers.formatSeconds(3665) === '01:01:05', 'formatSeconds(3665) returns 01:01:05');

const norm1 = helpers.normalizeChannelInfo('https://www.youtube.com/@3blue1brown');
assert(norm1.identifier === '@3blue1brown', 'normalizeChannelInfo handles @handle URL');

const norm2 = helpers.normalizeChannelInfo('@FreeCodeCamp');
assert(norm2.identifier === '@freecodecamp', 'normalizeChannelInfo handles raw handle with case');

const norm3 = helpers.normalizeChannelInfo('Apna College');
assert(norm3.name === 'Apna College', 'normalizeChannelInfo handles channel name');

// 7. Constants verification
const constants = require('./utils/constants.js');
assert(constants.MESSAGE_TYPES.TOGGLE_FOCUS_MODE, 'TOGGLE_FOCUS_MODE message constant exists');
assert(constants.MESSAGE_TYPES.TOGGLE_STRICT_FOCUS, 'TOGGLE_STRICT_FOCUS message constant exists');
assert(constants.DEFAULT_STORAGE.focusMode === true, 'DEFAULT_STORAGE has focusMode true');
assert(constants.DEFAULT_STORAGE.strictFocus === true, 'DEFAULT_STORAGE has strictFocus true');
assert(constants.DEFAULT_STORAGE.whitelist.length > 0, 'DEFAULT_STORAGE has initial learning whitelist');

console.log(`\n=== Verification Complete: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
