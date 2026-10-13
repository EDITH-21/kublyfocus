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
['index.html', 'about.html', 'install.html', 'support.html', 'admin.html'].forEach(file => {
  const filePath = path.join(websiteDir, file);
  assert(fs.existsSync(filePath), `Website file exists: ${file}`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('Knolect'), `${file} contains Knolect branding`);
});

// 1.1 Verify About Page Required Content & Structure
const aboutContent = fs.readFileSync(path.join(websiteDir, 'about.html'), 'utf8');
assert(aboutContent.includes('Learning deserves your attention.'), 'about.html contains Section A headline');
assert(aboutContent.includes('Less distraction.'), 'about.html contains Section B headline');
assert(aboutContent.includes('The Team Behind Knolect'), 'about.html contains The Team Behind Knolect headline');
assert(aboutContent.includes('Knolect is being built by a team focused on making digital learning more intentional and less distracting.'), 'about.html contains verified team supporting copy');
assert(aboutContent.includes('Aadrut') && aboutContent.includes('Project Lead & Product Architecture'), 'about.html contains verified Aadrut profile');
assert(aboutContent.includes('Shivam') && aboutContent.includes('Core Software Engineering'), 'about.html contains verified Shivam profile');

// 1.2 Verify Exactly ONE Project Credit in Footer across primary pages (no duplicates)
['index.html', 'about.html', 'install.html', 'support.html'].forEach(file => {
  const content = fs.readFileSync(path.join(websiteDir, file), 'utf8');
  const count = (content.match(/Project by Aadrut/g) || []).length;
  assert(count === 1, `${file} contains exactly ONE Project by Aadrut footer credit (found: ${count})`);
  assert(content.includes('about.html'), `${file} contains navigation link to About page`);
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
