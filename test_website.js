const fs = require('fs');
const path = require('path');

console.log('=== Starting BingeBlocker Website Verification Suite ===\n');

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

// 1. Core HTML files
const indexPath = path.join(__dirname, 'website', 'index.html');
const installPath = path.join(__dirname, 'website', 'install.html');
assert(fs.existsSync(indexPath), 'website/index.html exists');
assert(fs.existsSync(installPath), 'website/install.html exists');

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const installHtml = fs.readFileSync(installPath, 'utf8');

// 2. Check 12 Required Sections in index.html
const requiredSections = [
  { id: 'navbar', check: indexHtml.includes('<header class="navbar"') || indexHtml.includes('role="banner"') },
  { id: 'hero', check: indexHtml.includes('hero-section') && indexHtml.includes('Turn YouTube Into Your') },
  { id: 'problem', check: indexHtml.includes('problem') && indexHtml.includes('Recommendation Loop') },
  { id: 'demo', check: indexHtml.includes('demo') && indexHtml.includes('interactive-sim') },
  { id: 'features', check: indexHtml.includes('features') && indexHtml.includes('Focus Mode') && indexHtml.includes('Channel Whitelist') },
  { id: 'how-it-works', check: indexHtml.includes('how-it-works') && indexHtml.includes('How It Works') },
  { id: 'before-after', check: indexHtml.includes('comparison') && indexHtml.includes('Without BingeBlocker') && indexHtml.includes('With BingeBlocker') },
  { id: 'browsers', check: indexHtml.includes('browsers') && indexHtml.includes('Supported Browsers') },
  { id: 'privacy', check: indexHtml.includes('privacy') && indexHtml.includes('Your Data Stays In Your Browser') },
  { id: 'faq', check: indexHtml.includes('faq') && indexHtml.includes('Frequently Asked Questions') },
  { id: 'final-cta', check: indexHtml.includes('final-cta') && indexHtml.includes('Ready to make YouTube work for you?') },
  { id: 'footer', check: indexHtml.includes('<footer') && indexHtml.includes('Transforming YouTube into a Productive Learning Environment') }
];

requiredSections.forEach(sec => {
  assert(sec.check, `Website contains section: ${sec.id}`);
});

// 3. Central Configuration Check
const configPath = path.join(__dirname, 'website', 'js', 'config.js');
assert(fs.existsSync(configPath), 'website/js/config.js exists');
const configContent = fs.readFileSync(configPath, 'utf8');
assert(configContent.includes('const CHROME_STORE_URL'), 'config.js contains CHROME_STORE_URL single config variable');
assert(configContent.includes('detectBrowser'), 'config.js contains browser detection utility');

// 4. Stylesheet and Script Files Check
const expectedFiles = [
  'website/css/styles.css',
  'website/css/demo.css',
  'website/css/install.css',
  'website/js/config.js',
  'website/js/main.js',
  'website/js/demo.js',
  'website/js/install.js',
  'website/assets/logo.svg',
  'website/assets/favicon.svg',
  'website/assets/icons/chrome.svg',
  'website/assets/icons/edge.svg',
  'website/assets/icons/brave.svg',
  'website/assets/icons/opera.svg'
];

expectedFiles.forEach(fileRel => {
  const fileAbs = path.join(__dirname, fileRel);
  assert(fs.existsSync(fileAbs), `Asset/File exists: ${fileRel}`);
  const stat = fs.statSync(fileAbs);
  assert(stat.size > 20, `File is non-empty: ${fileRel} (${stat.size} bytes)`);
});

// 5. Check FAQ Questions count and accuracy
const faqQuestions = [
  'What is BingeBlocker?',
  'How does Focus Mode work?',
  'Does it block YouTube videos?',
  'Can I whitelist channels?',
  'Does it work with Edge and Brave?',
  'Does it require an account?',
  'Where is my data stored?',
  'Is BingeBlocker free?'
];

faqQuestions.forEach(q => {
  assert(indexHtml.includes(q), `FAQ includes question: "${q}"`);
});

console.log(`\n=== Website Verification Complete: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
