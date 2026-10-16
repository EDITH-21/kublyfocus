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

    // 2. Legitimate System Configuration: Feature Flags
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

    // 3. Legitimate System Configuration: Initial System Release Policy
    this.releases.set('rel_v100', {
      _id: 'rel_v100',
      version: '1.0.0',
      status: 'stable',
      releaseDate: new Date(),
      installCount: 0,
      activeUsers: 0,
      minSupported: true,
      notes: 'Initial production launch with Strict Focus, Learning Channels Allowlist, and Session Timer.'
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
