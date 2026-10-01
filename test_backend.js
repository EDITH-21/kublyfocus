/**
 * Knolect Backend API Automated Test Suite
 */

const { createApp } = require('./backend/src/app');

console.log('=== Starting Knolect Backend API Verification Suite ===\n');

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

// Mock request / response dispatcher
async function testRequest(app, method, url, body = null, headers = {}) {
  return new Promise((resolve) => {
    const listeners = {};
    const req = {
      method,
      url,
      headers: { host: 'localhost', ...headers },
      on(event, cb) {
        listeners[event] = cb;
      }
    };

    let responseData = '';
    const responseHeaders = {};

    const res = {
      statusCode: 200,
      setHeader(k, v) { responseHeaders[k] = v; },
      writeHead(code) { this.statusCode = code; },
      status(code) { this.statusCode = code; return this; },
      json(data) {
        responseData = JSON.stringify(data);
        resolve({ status: this.statusCode, body: data, headers: responseHeaders });
      },
      end(data) {
        responseData = data || '';
        try {
          resolve({ status: this.statusCode, body: JSON.parse(responseData), headers: responseHeaders });
        } catch (e) {
          resolve({ status: this.statusCode, body: responseData, headers: responseHeaders });
        }
      }
    };

    app.handle(req, res);

    if (listeners['data'] && body) {
      listeners['data'](JSON.stringify(body));
    }
    if (listeners['end']) {
      listeners['end']();
    }
  });
}

async function runTests() {
  const app = createApp();

  // 1. Health Check
  const healthRes = await testRequest(app, 'GET', '/api/admin/health');
  assert(healthRes.status === 200 && healthRes.body.success, 'Health check returns 200 OK');

  // 2. Auth - Register User
  const regRes = await testRequest(app, 'POST', '/api/auth/register', {
    email: 'student@example.com',
    name: 'Alex Rivera',
    password: 'Password123!'
  });
  assert(regRes.status === 201 && regRes.body.token, 'User registration succeeds and returns token');
  const userToken = regRes.body.token;

  // 3. Auth - Login User
  const loginRes = await testRequest(app, 'POST', '/api/auth/login', {
    email: 'student@example.com',
    password: 'Password123!'
  });
  assert(loginRes.status === 200 && loginRes.body.user.email === 'student@example.com', 'User login succeeds');

  // 4. User Settings
  const settingsRes = await testRequest(app, 'GET', '/api/user/settings', null, {
    authorization: `Bearer ${userToken}`
  });
  assert(settingsRes.status === 200 && settingsRes.body.settings.focusMode === true, 'Get user settings succeeds');

  // 5. Whitelist Add & List
  const wlAddRes = await testRequest(app, 'POST', '/api/whitelist', {
    channelName: '3Blue1Brown',
    channelIdentifier: '@3blue1brown',
    channelUrl: 'https://www.youtube.com/@3blue1brown'
  }, { authorization: `Bearer ${userToken}` });
  assert(wlAddRes.status === 201 && wlAddRes.body.channel.channelName === '3Blue1Brown', 'Add whitelist item succeeds');

  const wlListRes = await testRequest(app, 'GET', '/api/whitelist', null, {
    authorization: `Bearer ${userToken}`
  });
  assert(wlListRes.status === 200 && wlListRes.body.whitelist.length === 1, 'List whitelist items succeeds');

  // 6. Whitelist Delete
  const wlId = wlAddRes.body.channel._id;
  const wlDelRes = await testRequest(app, 'DELETE', `/api/whitelist/${wlId}`, null, {
    authorization: `Bearer ${userToken}`
  });
  assert(wlDelRes.status === 200 && wlDelRes.body.success, 'Delete whitelist item succeeds');

  // 7. Session Creation & Stats
  const sesRes = await testRequest(app, 'POST', '/api/sessions', {
    duration: 1500,
    status: 'completed'
  }, { authorization: `Bearer ${userToken}` });
  assert(sesRes.status === 201 && sesRes.body.session.duration === 1500, 'Create session succeeds');

  const statsRes = await testRequest(app, 'GET', '/api/sessions/stats');
  assert(statsRes.status === 200 && statsRes.body.stats.totalSessions >= 1, 'Get session stats succeeds');

  // 8. Feedback Submission
  const fbRes = await testRequest(app, 'POST', '/api/feedback', {
    type: 'feature',
    message: 'Love Strict Focus Mode! Great for studying.'
  });
  assert(fbRes.status === 201 && fbRes.body.success, 'Feedback submission succeeds');

  // 9. Bug Reporting
  const bugRes = await testRequest(app, 'POST', '/api/bugs', {
    title: 'Shorts blocked correctly',
    description: 'Verified testing pipeline',
    browser: 'Chrome',
    extensionVersion: '1.0.0'
  });
  assert(bugRes.status === 201 && bugRes.body.success, 'Bug reporting succeeds');

  // 10. Privacy-Safe Analytics
  const evtRes = await testRequest(app, 'POST', '/api/analytics/events', {
    eventName: 'focus_enabled',
    metadata: { mode: 'strict', videoTitle: 'SENSITIVE_SHOULD_BE_STRIPPED' }
  });
  assert(evtRes.status === 201 && !evtRes.body.event.metadata.videoTitle, 'Analytics logs event & strips private video titles');

  // 11. Admin Login & Overview Protection
  const adminLoginRes = await testRequest(app, 'POST', '/api/auth/login', {
    email: 'admin@knolect.app',
    password: 'AdminKnolect@2026'
  });
  assert(adminLoginRes.status === 200 && adminLoginRes.body.user.role === 'admin', 'Admin login succeeds');
  const adminToken = adminLoginRes.body.token;

  const adminOverviewRes = await testRequest(app, 'GET', '/api/admin/overview', null, {
    authorization: `Bearer ${adminToken}`
  });
  assert(adminOverviewRes.status === 200 && adminOverviewRes.body.overview.totalUsers >= 2, 'Admin overview accessible by admin');

  // 12. Non-Admin Forbidden from Admin Endpoints
  const forbiddenRes = await testRequest(app, 'GET', '/api/admin/overview', null, {
    authorization: `Bearer ${userToken}`
  });
  assert(forbiddenRes.status === 403, 'Normal user blocked with 403 Forbidden from admin endpoints');

  console.log(`\n=== Backend Verification Complete: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
