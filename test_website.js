/**
 * Knolect Website & Assets Verification Suite
 */

const fs = require('fs');
const path = require('path');

console.log('=== Starting Knolect Website Verification Suite ===\n');

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

const websiteDir = path.join(__dirname, 'website');

// 1. Check HTML Pages
['index.html', 'install.html', 'support.html', 'admin.html'].forEach(file => {
  const filePath = path.join(websiteDir, file);
  assert(fs.existsSync(filePath), `Website file exists: ${file}`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('Knolect'), `${file} contains Knolect branding`);
});

// 2. Check CSS Stylesheets
['styles.css', 'demo.css', 'install.css'].forEach(file => {
  const filePath = path.join(websiteDir, 'css', file);
  assert(fs.existsSync(filePath), `CSS file exists: css/${file}`);
});

// 3. Check JavaScript files
['config.js', 'demo.js', 'install.js', 'main.js'].forEach(file => {
  const filePath = path.join(websiteDir, 'js', file);
  assert(fs.existsSync(filePath), `JS file exists: js/${file}`);
});

// 4. Check Logo and Browser SVG Icons
['logo.svg', 'favicon.svg'].forEach(file => {
  const filePath = path.join(websiteDir, 'assets', file);
  assert(fs.existsSync(filePath), `Brand asset exists: assets/${file}`);
});

['chrome.svg', 'edge.svg', 'brave.svg', 'opera.svg'].forEach(file => {
  const filePath = path.join(websiteDir, 'assets', 'icons', file);
  assert(fs.existsSync(filePath), `Browser icon exists: assets/icons/${file}`);
});

console.log(`\n=== Website Verification Complete: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
