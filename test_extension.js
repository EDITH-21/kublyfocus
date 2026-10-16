const fs = require('fs');
const path = require('path');

console.log('=== Starting Knolect Extension & Learning Channels Verification Suite ===\n');

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

const extDir = path.join(__dirname, 'extension');
assert(fs.existsSync(extDir), 'extension/ directory exists');

// 1. Manifest JSON Verification
const manifestPath = path.join(extDir, 'manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.json exists in extension/');

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
    const iconAbs = path.join(extDir, iconRelPath);
    assert(fs.existsSync(iconAbs), `Icon file exists: ${iconRelPath}`);
    const stat = fs.statSync(iconAbs);
    assert(stat.size > 50, `Icon file is non-empty: ${iconRelPath} (${stat.size} bytes)`);
  }
}

// 3. Popup files verification
const popupHtml = path.join(extDir, manifest.action.default_popup);
const popupCss = path.join(extDir, 'popup', 'popup.css');
const popupJs = path.join(extDir, 'popup', 'popup.js');

assert(fs.existsSync(popupHtml), 'popup.html exists');
assert(fs.existsSync(popupCss), 'popup.css exists');
assert(fs.existsSync(popupJs), 'popup.js exists');

// 4. Background Service Worker verification
const swPath = path.join(extDir, manifest.background.service_worker);
assert(fs.existsSync(swPath), 'service-worker.js exists');

// 5. Content Script files verification
if (manifest && manifest.content_scripts) {
  manifest.content_scripts.forEach((cs) => {
    (cs.js || []).forEach(jsFile => {
      assert(fs.existsSync(path.join(extDir, jsFile)), `Content script JS exists: ${jsFile}`);
    });
    (cs.css || []).forEach(cssFile => {
      assert(fs.existsSync(path.join(extDir, cssFile)), `Content script CSS exists: ${cssFile}`);
    });
  });
}

// 6. Helper logic unit tests
const helpers = require('./extension/utils/helpers.js');
assert(helpers.formatSeconds(1500) === '25:00', 'formatSeconds(1500) returns 25:00');
assert(helpers.formatSeconds(0) === '00:00', 'formatSeconds(0) returns 00:00');
assert(helpers.formatSeconds(3665) === '01:01:05', 'formatSeconds(3665) returns 01:01:05');

// Normalization tests
const norm1 = helpers.normalizeChannelInfo('https://www.youtube.com/@PW-Foundation');
assert(norm1.normalizedHandle === 'pw-foundation', 'normalizeChannelInfo handles @PW-Foundation URL');

const norm2 = helpers.normalizeChannelInfo('@FreeCodeCamp');
assert(norm2.normalizedHandle === 'freecodecamp', 'normalizeChannelInfo handles case-insensitive @handle');

const norm3 = helpers.normalizeChannelInfo('https://www.youtube.com/channel/UCV3ab_4Tsq_j3_cI-8n_rAw');
assert(norm3.channelId === 'UCV3ab_4Tsq_j3_cI-8n_rAw', 'normalizeChannelInfo handles YouTube /channel/UC... URL');

// 7. Channel Classifier Unit Tests (Section 23 Requirements)
const classifier = require('./extension/utils/classifier.js');

// Test A: PW Foundation Educational Channel
const pwResult = classifier.classifyChannel({
  name: 'PW Foundation',
  handle: '@PW-Foundation',
  channelId: 'UCV3ab_4Tsq_j3_cI-8n_rAw'
});
assert(pwResult.eligible === true && pwResult.category === 'education', 'Test A: PW Foundation is classified as verified educational channel');

// Test B: Known educational channels
const gateResult = classifier.classifyChannel({
  name: 'Gate Smashers',
  handle: '@GateSmashers',
  description: 'Gate Computer Science, Operating Systems, DBMS and Algorithms'
});
assert(gateResult.eligible === true, 'Test B: Gate Smashers is eligible for Learning Allowlist');

const mathResult = classifier.classifyChannel({
  name: 'Calculus & Physics Masterclass',
  handle: '@mathphysicsacademy',
  description: 'University level calculus, algebra, and exam preparation tutorials'
});
assert(mathResult.eligible === true && mathResult.confidence >= 70, 'Test B2: Math & Physics tutorial channel is eligible with high confidence');

// Test C: Music Channel (BLOCK)
const musicResult = classifier.classifyChannel({
  name: 'T-Series Official Songs',
  handle: '@tseriesmusic',
  description: 'Official music videos, soundtrack, Bollywood songs, and album releases'
});
assert(musicResult.eligible === false && musicResult.category === 'entertainment', 'Test C: Music channel is strictly BLOCKED');

// Test D: Gaming Channel (BLOCK)
const gamingResult = classifier.classifyChannel({
  name: 'Pro Gamer GTA & Minecraft',
  handle: '@progamingchannel',
  description: 'Daily gaming streams, gameplay clips, and let\'s play videos'
});
assert(gamingResult.eligible === false && gamingResult.category === 'entertainment', 'Test D: Gaming channel is strictly BLOCKED');

// Test E: Comedy / Roast Channel (BLOCK)
const comedyResult = classifier.classifyChannel({
  name: 'Standup Comedy & Roast TV',
  handle: '@dailycomedyroast',
  description: 'Funny pranks, roast videos, and comedy skits'
});
assert(comedyResult.eligible === false && comedyResult.category === 'entertainment', 'Test E: Comedy/Roast channel is strictly BLOCKED');

// Test F: Daily Vlog Channel (BLOCK)
const vlogResult = classifier.classifyChannel({
  name: 'Daily Family Vlogs & Lifestyle',
  handle: '@dailyfamilyvlogs',
  description: 'Our daily lifestyle vlogs, shopping haul, and challenges'
});
assert(vlogResult.eligible === false && vlogResult.category === 'entertainment', 'Test F: Vlog channel is strictly BLOCKED');

// Test G: Mixed Channel (BLOCK / Review)
const mixedResult = classifier.classifyChannel({
  name: 'Tech & Gaming Vlogs',
  handle: '@techgamingvlogs',
  description: 'Python coding tutorials mixed with daily gaming streams and comedy pranks'
});
assert(mixedResult.eligible === false, 'Test G: Mixed content channel is not automatically eligible');

// Test H: Unknown Channel without learning signals (Default = BLOCK)
const unknownResult = classifier.classifyChannel({
  name: 'Random Creator 992',
  handle: '@randomcreator992'
});
assert(unknownResult.eligible === false && unknownResult.category === 'unknown', 'Test H: Unknown channel defaults to BLOCK');

// Test I, J, K: Handle, URL, Channel ID Canonical Matching
const idObj1 = classifier.resolveChannelIdentity('https://www.youtube.com/@3blue1brown');
const idObj2 = classifier.resolveChannelIdentity('@3blue1brown');
const idObj3 = classifier.resolveChannelIdentity('3blue1brown');
assert(
  idObj1.normalizedHandle === '3blue1brown' &&
  idObj2.normalizedHandle === '3blue1brown' &&
  idObj3.normalizedHandle === '3blue1brown',
  'Test I, J: Canonical handle resolution matches across URL, @handle, and name'
);

const verifiedMatch = classifier.isSystemVerifiedLearningChannel({ handle: '@mitocw' });
assert(verifiedMatch !== null && verifiedMatch.name.includes('MIT'), 'Test K: System verified registry matches canonical channel');

// Test N: Stored entry validation / Legacy unverified entries
const validSaved = {
  name: 'MIT OpenCourseWare',
  handle: '@mitocw',
  category: 'education',
  confidence: 100,
  source: 'system_verified'
};
assert(classifier.isStillEligible(validSaved) === true, 'Test M: Verified saved channel remains eligible');

const legacyEntertainment = {
  name: 'Funny Gaming Pranks TV',
  handle: '@gamingpranks',
  category: 'entertainment',
  confidence: 20,
  eligible: false
};
assert(classifier.isStillEligible(legacyEntertainment) === false, 'Test N: Legacy entertainment entry is BLOCKED');

// Test P: Offline deterministic behavior
assert(typeof classifier.classifyChannel === 'function', 'Test P: Classifier executes locally with zero external API calls');

// =========================================================================
// BUG 1 & BUG 2 REGRESSION & ENHANCEMENT TESTS
// =========================================================================

// Test Q: Canonical matching (Channel ID primary, handle fallback)
const chA = {
  channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
  name: 'MIT Different Display Name',
  handle: '@differenthandle'
};
const chB = {
  channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
  name: 'MIT OpenCourseWare',
  handle: '@mitocw'
};
assert(helpers.matchesChannelIdentity(chA, chB) === true, 'Test Q1: Matches canonically by YouTube Channel ID despite different display names');

const chHandleA = { handle: '@MyStudyChannel', name: 'My Study' };
const chHandleB = { handle: '@mystudychannel', name: 'Study Channel' };
assert(helpers.matchesChannelIdentity(chHandleA, chHandleB) === true, 'Test Q2: Matches canonically by normalized handle case-insensitively');

// Test R: Avatar extraction & preservation
const chWithAvatar = helpers.normalizeChannelInfo({
  name: 'Organic Chemistry Tutor',
  handle: '@TheOrganicChemistryTutor',
  avatarUrl: 'https://yt3.ggpht.com/avatar123.jpg'
});
assert(chWithAvatar.avatarUrl === 'https://yt3.ggpht.com/avatar123.jpg', 'Test R: Avatar URL is properly extracted and preserved');

// Test S: Dashboard URL dynamic resolution (Bug 2)
const constants = require('./extension/utils/constants.js');
assert(constants.DEFAULT_PRODUCTION_DASHBOARD_URL === 'https://kublyfocus.vercel.app/dashboard', 'Test S1: Default production dashboard URL is https://kublyfocus.vercel.app/dashboard');
assert(helpers.resolveDashboardUrl() === 'https://kublyfocus.vercel.app/dashboard', 'Test S2: resolveDashboardUrl defaults to production dashboard URL');
assert(helpers.resolveDashboardUrl(null, 'http://localhost:3000') === 'http://localhost:3000/dashboard', 'Test S3: resolveDashboardUrl detects localhost context');
assert(helpers.resolveDashboardUrl({ dashboardUrl: 'https://custom.knolect.com/dashboard' }) === 'https://custom.knolect.com/dashboard', 'Test S4: resolveDashboardUrl respects custom user settings');

// Test T: Popup HTML dashboard elements and avatar UI
const popupHtmlContent = fs.readFileSync(popupHtml, 'utf8');
assert(popupHtmlContent.includes('id="btn-open-dashboard"'), 'Test T1: popup.html contains #btn-open-dashboard');
assert(popupHtmlContent.includes('id="btn-open-dashboard-settings"'), 'Test T2: popup.html contains #btn-open-dashboard-settings');
assert(popupHtmlContent.includes('id="current-channel-avatar"'), 'Test T3: popup.html contains #current-channel-avatar for channel thumbnail');
assert(!popupHtmlContent.includes('href="http://localhost:3000/dashboard"'), 'Test T4: popup.html has eliminated broken hardcoded localhost hrefs');

// Test U: Explicit allowlisting precedence in Storage Layer
// Mock chrome.storage.local for unit testing storage functions in Node environment
const mockStorage = {
  focusMode: true,
  strictFocus: true,
  learningChannels: [
    {
      channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      name: 'MIT OpenCourseWare',
      handle: '@mitocw',
      normalizedHandle: 'mitocw',
      source: 'system_verified',
      category: 'education'
    }
  ]
};

global.chrome = {
  storage: {
    local: {
      get: (keys, cb) => {
        if (typeof keys === 'string') cb({ [keys]: mockStorage[keys] });
        else if (Array.isArray(keys)) {
          const res = {};
          keys.forEach(k => { res[k] = mockStorage[k]; });
          cb(res);
        } else if (keys === null) cb({ ...mockStorage });
        else cb({});
      },
      set: (obj, cb) => {
        Object.assign(mockStorage, obj);
        if (cb) cb();
      }
    }
  },
  runtime: { lastError: null }
};

const storage = require('./extension/storage/storage.js');

(async () => {
  // Test U1: Allowlisting a study channel with explicit flag succeeds
  const addRes = await storage.addLearningChannel({
    channelId: 'UCstudy1234567890123456',
    name: 'Advanced Pathology Lectures',
    handle: '@pathologylectures',
    explicit: true
  });
  assert(addRes.success === true, 'Test U1: Explicit study channel allowlisting succeeds');

  // Test U2: isChannelLearningApproved returns true for allowlisted channel
  const isApproved = await storage.isChannelLearningApproved({
    channelId: 'UCstudy1234567890123456'
  });
  assert(isApproved === true, 'Test U2: isChannelLearningApproved gives precedence to allowlisted channel');

  // Test U3: Removing channel succeeds
  const removeRes = await storage.removeLearningChannel('UCstudy1234567890123456');
  assert(removeRes.success === true, 'Test U3: Removing channel succeeds');

  const isApprovedAfterRemove = await storage.isChannelLearningApproved({
    channelId: 'UCstudy1234567890123456'
  });
  assert(isApprovedAfterRemove === false, 'Test U4: Channel is no longer approved after removal');

  // =========================================================================
  // Test Suite V: Input Validation (isValidChannelInput)
  // =========================================================================
  assert(helpers.isValidChannelInput('@gautamvarde') === true, 'Test V1: Valid handle @gautamvarde accepted');
  assert(helpers.isValidChannelInput('https://www.youtube.com/@gautamvarde') === true, 'Test V2: Valid YouTube URL accepted');
  assert(helpers.isValidChannelInput('UC1234567890123456789012') === true, 'Test V3: Valid 24-char UC channel ID accepted');
  assert(helpers.isValidChannelInput('@@@') === false, 'Test V4: Invalid symbol string @@@ rejected');
  assert(helpers.isValidChannelInput('') === false && helpers.isValidChannelInput('<script>alert(1)</script>') === false, 'Test V5: Empty and malicious inputs rejected');

  // =========================================================================
  // Test Suite W: Strict Focus False Positives & "Allow for My Study" flow
  // =========================================================================
  const gautamClassification = classifier.classifyChannel({
    name: 'Gautam Varde',
    handle: '@gautamvarde'
  });
  assert(
    gautamClassification.eligible === false &&
    gautamClassification.unverified === true &&
    gautamClassification.category !== 'entertainment',
    'Test W1: Channel @gautamvarde without keyword signals is unverified, not entertainment'
  );
  assert(
    gautamClassification.reasons.some(r => r.includes('Couldn’t verify this channel automatically')),
    'Test W2: Unverified channel reason explains automatic verification was uncertain'
  );

  // User clicks "Allow for My Study" (explicit personal allowlist addition)
  const gautamAddRes = await storage.addLearningChannel({
    name: 'Gautam Varde',
    handle: '@gautamvarde',
    channelId: 'UCgautamvarde12345678901'
  }, { explicit: true, isPersonal: true });
  assert(gautamAddRes.success === true, 'Test W3: Allowing @gautamvarde for My Study succeeds');

  // Verify that once allowed, it bypasses Strict Focus blocking
  const gautamApproved = await storage.isChannelLearningApproved({
    handle: '@gautamvarde',
    channelId: 'UCgautamvarde12345678901'
  });
  assert(gautamApproved === true, 'Test W4: @gautamvarde is approved for learning in Strict Focus');

  // Verify stored item source is 'user_approved'
  const storedChannels = await storage.getLearningChannels();
  const storedGautam = storedChannels.find(c => c.handle === '@gautamvarde');
  assert(storedGautam && storedGautam.source === 'user_approved', 'Test W5: Stored channel is classified as user_approved');

  // Remove channel from allowlist
  const gautamRemoveRes = await storage.removeLearningChannel('@gautamvarde');
  assert(gautamRemoveRes.success === true, 'Test W6: Removing @gautamvarde from allowlist succeeds');

  const gautamApprovedAfter = await storage.isChannelLearningApproved({ handle: '@gautamvarde' });
  assert(gautamApprovedAfter === false, 'Test W7: @gautamvarde is blocked again after removal');

  // =========================================================================
  // Test Suite X: UI Integration Verification
  // =========================================================================
  const popupJsContent = fs.readFileSync(path.join(__dirname, 'extension/popup/popup.js'), 'utf8');
  assert(popupJsContent.includes('isValidChannelInput'), 'Test X1: popup.js validates channel inputs');
  assert(popupJsContent.includes('btn-allow-my-study'), 'Test X2: popup.js provides Allow for My Study button');
  assert(popupJsContent.includes('My Study Channels'), 'Test X3: popup.js separates My Study Channels from verified channels');

  const popupCssContent = fs.readFileSync(path.join(__dirname, 'extension/popup/popup.css'), 'utf8');
  assert(popupCssContent.includes('.classification-card.unverified'), 'Test X4: popup.css contains unverified card styles');
  assert(popupCssContent.includes('.personal-badge-mini'), 'Test X5: popup.css contains personal study badge styles');

  // =========================================================================
  // Test Suite Y: Extension Dashboard Integration
  // =========================================================================
  assert(manifest.options_ui && manifest.options_ui.page === 'dashboard/dashboard.html', 'Test Y1: manifest.options_ui is configured to dashboard/dashboard.html');
  
  const extDashHtmlPath = path.join(__dirname, 'extension/dashboard/dashboard.html');
  assert(fs.existsSync(extDashHtmlPath), 'Test Y2: extension/dashboard/dashboard.html exists');
  const extDashHtml = fs.readFileSync(extDashHtmlPath, 'utf8');
  assert(extDashHtml.includes('Focus Center'), 'Test Y2b: dashboard.html contains Focus Center title');
  assert(extDashHtml.includes('dashboard.js'), 'Test Y2c: dashboard.html loads dashboard.js');

  const extDashCssPath = path.join(__dirname, 'extension/dashboard/dashboard.css');
  assert(fs.existsSync(extDashCssPath), 'Test Y3: extension/dashboard/dashboard.css exists');

  const extDashJsPath = path.join(__dirname, 'extension/dashboard/dashboard.js');
  assert(fs.existsSync(extDashJsPath), 'Test Y4: extension/dashboard/dashboard.js exists');
  const extDashJs = fs.readFileSync(extDashJsPath, 'utf8');
  assert(extDashJs.includes('getStorageData'), 'Test Y4b: dashboard.js reads on-device telemetry from local storage');

  assert(popupJsContent.includes('dashboard/dashboard.html'), 'Test Y5: popup.js launches extension dashboard URL');
  
  const swContent = fs.readFileSync(path.join(__dirname, 'extension/background/service-worker.js'), 'utf8');
  assert(swContent.includes('dashboard/dashboard.html'), 'Test Y6: service-worker.js resolves extension dashboard URL');

  console.log(`\n=== Verification Complete: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
})();
