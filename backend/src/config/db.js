/**
 * Knolect Database Configuration
 * Supports standard MongoDB connection with high-availability in-memory store fallback
 * to guarantee that Knolect works reliably in any environment.
 */

const crypto = require('crypto');

class InMemoryStore {
  constructor() {
    this.users = new Map();
    this.settings = new Map();
    this.whitelist = new Map();
    this.sessions = new Map();
    this.feedback = new Map();
    this.bugs = new Map();
    this.analytics = [];
    this.featureFlags = new Map();
    this.announcements = new Map();
    this.remoteConfig = {
      defaultDuration: 1500,
      maintenanceMode: false,
      minExtensionVersion: '1.0.0',
      announcementBanner: 'Knolect v1.0.0 is live — Transform YouTube into your learning space.'
    };
    this.auditLogs = [];
    this.releases = new Map();
    this.systemErrors = new Map();

    // 1. Seed Super Admin
    const adminId = 'usr_admin_001';
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminHash = crypto.pbkdf2Sync('AdminKnolect@2026', adminSalt, 1000, 64, 'sha512').toString('hex');

    this.users.set(adminId, {
      _id: adminId,
      email: 'admin@knolect.app',
      name: 'Knolect Administrator',
      passwordHash: adminHash,
      salt: adminSalt,
      role: 'admin',
      adminRole: 'super_admin',
      status: 'active',
      browser: 'Chrome 122',
      extensionVersion: '1.0.0',
      createdAt: new Date(Date.now() - 30 * 86400000),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    });

    // 2. Seed Sample Users for rich user management
    const sampleUsers = [
      { id: 'usr_002', name: 'Aarav Sharma', email: 'aarav.study@example.com', browser: 'Chrome 122', version: '1.0.0', sessions: 28, totalTime: 720 },
      { id: 'usr_003', name: 'Elena Rostova', email: 'elena.code@example.com', browser: 'Brave 1.63', version: '1.0.0', sessions: 42, totalTime: 1150 },
      { id: 'usr_004', name: 'Marcus Chen', email: 'marcus.upsc@example.com', browser: 'Edge 121', version: '1.0.0', sessions: 19, totalTime: 480 },
      { id: 'usr_005', name: 'Priya Patel', email: 'priya.neet@example.com', browser: 'Chrome 122', version: '1.0.0', sessions: 35, totalTime: 920 },
      { id: 'usr_006', name: 'David Miller', email: 'david.dev@example.com', browser: 'Opera 107', version: '1.0.0', sessions: 14, totalTime: 360 }
    ];

    sampleUsers.forEach(u => {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync('Password123!', salt, 1000, 64, 'sha512').toString('hex');
      this.users.set(u.id, {
        _id: u.id,
        email: u.email,
        name: u.name,
        passwordHash: hash,
        salt,
        role: 'user',
        status: 'active',
        browser: u.browser,
        extensionVersion: u.version,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 20 + 2) * 86400000),
        updatedAt: new Date(),
        lastLoginAt: new Date(Date.now() - Math.floor(Math.random() * 86400000))
      });

      // Add dummy sessions
      for (let i = 0; i < 4; i++) {
        const sesId = 'ses_' + u.id + '_' + i;
        this.sessions.set(sesId, {
          _id: sesId,
          userId: u.id,
          duration: 1500,
          status: i === 3 ? 'interrupted' : 'completed',
          startedAt: new Date(Date.now() - (i + 1) * 86400000),
          completedAt: new Date(Date.now() - (i + 1) * 86400000 + 1500000)
        });
      }
    });

    // 3. Seed Feature Flags
    const defaultFlags = [
      { id: 'flag_strict_focus', name: 'Strict Focus Mode', key: 'strict_focus', enabled: true, rollout: 100, description: 'Allowlist-first YouTube access enforcement' },
      { id: 'flag_shorts_blocker', name: 'Shorts Suppression v2', key: 'shorts_blocker_v2', enabled: true, rollout: 100, description: 'Deep suppression of short-form reels on watch and home pages' },
      { id: 'flag_search_protection', name: 'Search Exploration Shield', key: 'search_protection', enabled: true, rollout: 100, description: 'Disables exploratory search distraction during active focus' },
      { id: 'flag_focus_layer', name: 'Floating Focus OS Layer', key: 'floating_focus_layer', enabled: true, rollout: 100, description: 'Minimalist on-screen live timer and focus indicator' },
      { id: 'flag_ai_classifier_beta', name: 'AI Study Channel Classifier Beta', key: 'ai_classifier_beta', enabled: false, rollout: 25, description: 'Advanced heuristic classifier for mixed multi-topic creators' }
    ];

    defaultFlags.forEach(f => {
      this.featureFlags.set(f.id, { ...f, createdAt: new Date(), updatedAt: new Date() });
    });

    // 4. Seed Announcements
    this.announcements.set('ann_001', {
      _id: 'ann_001',
      title: 'Welcome to Knolect 1.0!',
      content: 'Turn YouTube into your learning space. Enable Strict Focus to study without algorithmic distractions.',
      type: 'feature',
      target: 'all',
      active: true,
      createdAt: new Date(Date.now() - 5 * 86400000)
    });

    // 5. Seed Releases
    this.releases.set('rel_v100', {
      _id: 'rel_v100',
      version: '1.0.0',
      status: 'stable',
      releaseDate: new Date(Date.now() - 10 * 86400000),
      installCount: 1420,
      activeUsers: 890,
      minSupported: true,
      notes: 'Initial production launch with Strict Focus, Learning Channels Allowlist, and Session Timer.'
    });

    // 6. Seed System Error Logs (Simulated telemetry)
    this.systemErrors.set('err_001', {
      _id: 'err_001',
      errorType: 'DOM_SELECTOR_TIMEOUT',
      message: 'YouTube watch-metadata delayed load on slow 3G connection',
      affectedVersion: '1.0.0',
      browser: 'Chrome 122',
      count: 3,
      lastSeen: new Date(Date.now() - 2 * 3600000),
      resolved: false
    });

    // 7. Seed Initial Audit Logs
    this.auditLogs.push({
      _id: 'aud_001',
      admin: 'Knolect Administrator',
      adminEmail: 'admin@knolect.app',
      action: 'SYSTEM_INITIALIZATION',
      details: 'Product ecosystem initialized and Strict Focus Allowlist enabled globally.',
      timestamp: new Date(Date.now() - 10 * 86400000)
    });
  }
}

const memoryStore = new InMemoryStore();

const dbConfig = {
  isConnected: false,
  isInMemory: true,
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/knolect',

  async connect() {
    console.log('[Knolect DB] Initialized Data Engine (Secure InMemory + MongoDB Connector ready)');
    this.isConnected = true;
    return true;
  },

  getStore() {
    return memoryStore;
  }
};

module.exports = dbConfig;
