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
assert(aboutContent.includes('Meet the Team Behind Knolect'), 'about.html contains Meet the Team Behind Knolect headline');
assert(aboutContent.includes('Three founders. One mission: make learning more focused.'), 'about.html contains founding team subtitle');
assert(aboutContent.includes('Shivam Tiwari') && aboutContent.includes('CEO & Founder'), 'about.html contains Shivam Tiwari (CEO & Founder)');
assert(aboutContent.includes('Durvaa Bhatt') && aboutContent.includes('CTO & Co-founder'), 'about.html contains Durvaa Bhatt (CTO & Co-founder)');
assert(aboutContent.includes('Kajal Pal') && aboutContent.includes('COO & Co-founder'), 'about.html contains Kajal Pal (COO & Co-founder)');

// 1.2 Verify Exactly ONE Project Credit in Footer across primary pages (no duplicates)
['index.html', 'about.html', 'install.html', 'support.html'].forEach(file => {
  const content = fs.readFileSync(path.join(websiteDir, file), 'utf8');
  const count = (content.match(/Project by Aadrut/g) || []).length;
  assert(count === 1, `${file} contains exactly ONE Project by Aadrut footer credit (found: ${count})`);
  assert(content.includes('about.html'), `${file} contains navigation link to About page`);
  // Verify personal dashboard has been removed from public website navigation
  assert(!content.includes('class="nav-link" href="dashboard.html"') && !content.includes('href="dashboard.html" class="nav-link"'), `${file} has removed dashboard link from desktop navigation`);
  assert(!content.includes('class="mobile-nav-link" href="dashboard.html"') && !content.includes('href="dashboard.html" class="mobile-nav-link"'), `${file} has removed dashboard link from mobile drawer`);
});

// 1.3 Verify Website Dashboard is a Private Gate
const dashContent = fs.readFileSync(path.join(websiteDir, 'dashboard.html'), 'utf8');
assert(dashContent.includes('Personal Dashboard is Private'), 'website/dashboard.html serves privacy gate');
assert(dashContent.includes('exclusively inside the Knolect Browser Extension'), 'website/dashboard.html explains extension location');

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

// 5. Check Installation Journey, Video Tutorial & Usage Sections
const installHtmlContent = fs.readFileSync(path.join(websiteDir, 'install.html'), 'utf8');
assert(installHtmlContent.includes('id="installation"'), 'install.html contains #installation section');
assert(installHtmlContent.includes('id="tutorial"'), 'install.html contains #tutorial section');
assert(installHtmlContent.includes('See Knolect in Action'), 'install.html contains See Knolect in Action headline');
assert(installHtmlContent.includes('Learn how to turn YouTube into a focused learning space in just a few minutes.'), 'install.html contains video tutorial subheading');
assert(installHtmlContent.includes('id="usage"'), 'install.html contains #usage section');
assert(installHtmlContent.includes('How to Use Knolect'), 'install.html contains How to Use Knolect headline');
assert(installHtmlContent.includes('id="faq"'), 'install.html contains #faq section');
assert(installHtmlContent.includes('assets/tutorial-poster.svg'), 'install.html loads tutorial-poster.svg');
assert(fs.existsSync(path.join(websiteDir, 'assets', 'tutorial-poster.svg')), 'Brand asset exists: assets/tutorial-poster.svg');

// 6. Check Chrome Web Store Preparation Assets & Scripts
assert(fs.existsSync(path.join(__dirname, 'CHROMEWEBSTORE.md')), 'CHROMEWEBSTORE.md exists in project root');
assert(fs.existsSync(path.join(__dirname, 'scripts', 'package-extension.js')), 'scripts/package-extension.js packaging tool exists');

console.log(`\n=== Website Verification Complete: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
