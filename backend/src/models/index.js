/**
 * Knolect Data Models & Schemas
 */

const crypto = require('crypto');
const { getStore } = require('../config/db');

// --- 1. User Model ---
class UserModel {
  static async create({ email, name, password, role = 'user' }) {
    const store = getStore();
    const existing = Array.from(store.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const _id = 'usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    const user = {
      _id,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash,
      salt,
      role: role === 'admin' ? 'admin' : 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    };

    store.users.set(_id, user);
    return this.sanitize(user);
  }

  static async findByEmail(email) {
    const store = getStore();
    return Array.from(store.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async findById(id) {
    const store = getStore();
    const user = store.users.get(id);
    return user ? this.sanitize(user) : null;
  }

  static verifyPassword(user, password) {
    if (!user || !user.salt || !user.passwordHash) return false;
    const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
    return hash === user.passwordHash;
  }

  static async listAll() {
    const store = getStore();
    return Array.from(store.users.values()).map(u => this.sanitize(u));
  }

  static sanitize(user) {
    if (!user) return null;
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }
}

// --- 2. User Settings Model ---
class UserSettingsModel {
  static async getByUserId(userId) {
    const store = getStore();
    if (!store.settings.has(userId)) {
      const defaults = {
        userId,
        focusMode: true,
        strictFocus: true,
        timerPreferences: { defaultDuration: 1500 },
        distractionSettings: {
          hideShorts: true,
          hideComments: true,
          hideRecommendations: true,
          hideHomeFeed: true,
          hideEndScreen: true,
          blockSearch: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.settings.set(userId, defaults);
    }
    return store.settings.get(userId);
  }

  static async updateByUserId(userId, updates) {
    const current = await this.getByUserId(userId);
    const updated = {
      ...current,
      ...updates,
      distractionSettings: {
        ...current.distractionSettings,
        ...(updates.distractionSettings || {})
      },
      updatedAt: new Date()
    };
    getStore().settings.set(userId, updated);
    return updated;
  }
}

// --- 3. Whitelist Model ---
class WhitelistModel {
  static async listByUserId(userId) {
    const store = getStore();
    return Array.from(store.whitelist.values()).filter(w => w.userId === userId);
  }

  static async add({ userId, channelName, channelIdentifier, channelUrl }) {
    const store = getStore();
    const _id = 'wl_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    const item = {
      _id,
      userId,
      channelId: channelIdentifier || channelName.toLowerCase().replace(/\s+/g, ''),
      channelName,
      channelUrl: channelUrl || `https://www.youtube.com/@${encodeURIComponent(channelName)}`,
      createdAt: new Date()
    };
    store.whitelist.set(_id, item);
    return item;
  }

  static async remove(id, userId) {
    const store = getStore();
    const item = store.whitelist.get(id);
    if (item && item.userId === userId) {
      store.whitelist.delete(id);
      return true;
    }
    return false;
  }
}

// --- 4. Session Model ---
class SessionModel {
  static async create({ userId, duration, status = 'completed' }) {
    const store = getStore();
    const _id = 'ses_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    const session = {
      _id,
      userId: userId || 'anonymous',
      duration: Number(duration) || 1500,
      startedAt: new Date(Date.now() - (duration || 1500) * 1000),
      completedAt: new Date(),
      status
    };
    store.sessions.set(_id, session);
    return session;
  }

  static async listByUserId(userId) {
    const store = getStore();
    return Array.from(store.sessions.values()).filter(s => s.userId === userId);
  }

  static async getStats() {
    const store = getStore();
    const all = Array.from(store.sessions.values());
    const totalCount = all.length;
    const totalMinutes = all.reduce((acc, s) => acc + Math.round((s.duration || 0) / 60), 0);
    return {
      totalSessions: totalCount,
      totalFocusMinutes: totalMinutes,
      completedSessions: all.filter(s => s.status === 'completed').length
    };
  }
}

// --- 5. Feedback Model ---
class FeedbackModel {
  static async create({ userId, type = 'general', message }) {
    const store = getStore();
    const _id = 'fb_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    const feedback = {
      _id,
      userId: userId || 'guest',
      type,
      message,
      status: 'open',
      createdAt: new Date()
    };
    store.feedback.set(_id, feedback);
    return feedback;
  }

  static async listAll() {
    const store = getStore();
    return Array.from(store.feedback.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  static async updateStatus(id, status) {
    const store = getStore();
    const fb = store.feedback.get(id);
    if (fb) {
      fb.status = status;
      fb.updatedAt = new Date();
      return fb;
    }
    return null;
  }
}

// --- 6. Bug Report Model ---
class BugReportModel {
  static async create({ userId, title, description, browser, extensionVersion }) {
    const store = getStore();
    const _id = 'bug_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    const bug = {
      _id,
      userId: userId || 'guest',
      title,
      description,
      browser: browser || 'Chrome',
      extensionVersion: extensionVersion || '1.0.0',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.bugs.set(_id, bug);
    return bug;
  }

  static async listAll() {
    const store = getStore();
    return Array.from(store.bugs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  static async updateStatus(id, status) {
    const store = getStore();
    const bug = store.bugs.get(id);
    if (bug) {
      bug.status = status;
      bug.updatedAt = new Date();
      return bug;
    }
    return null;
  }
}

// --- 7. Analytics Event Model (Strictly Non-Browsing Data) ---
class AnalyticsEventModel {
  static async logEvent({ userId, eventName, metadata = {} }) {
    const store = getStore();
    // Safety check: Never allow URLs or personal titles in analytics
    const safeMetadata = { ...metadata };
    delete safeMetadata.url;
    delete safeMetadata.videoTitle;
    delete safeMetadata.searchQuery;

    const event = {
      _id: 'evt_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      userId: userId || 'anonymous',
      eventName,
      metadata: safeMetadata,
      timestamp: new Date()
    };
    store.analytics.push(event);
    return event;
  }

  static async getSummary() {
    const store = getStore();
    const summary = {};
    store.analytics.forEach(e => {
      summary[e.eventName] = (summary[e.eventName] || 0) + 1;
    });
    return {
      totalEvents: store.analytics.length,
      eventsByType: summary
    };
  }
}

module.exports = {
  UserModel,
  UserSettingsModel,
  WhitelistModel,
  SessionModel,
  FeedbackModel,
  BugReportModel,
  AnalyticsEventModel
};
