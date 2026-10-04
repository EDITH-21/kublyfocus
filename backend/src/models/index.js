/**
 * Knolect Data Models & Schemas
 * Full ecosystem support for Users, Settings, Learning Channels, Sessions,
 * Feature Flags, Announcements, System Releases, Audit Logs, and Telemetry.
 */

const crypto = require('crypto');
const { getStore } = require('../config/db');

// --- 1. User Model ---
class UserModel {
  static async create({ email, name, password, role = 'user', browser = 'Chrome', extensionVersion = '1.0.0' }) {
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
      adminRole: role === 'admin' ? 'super_admin' : null,
      status: 'active',
      browser: browser || 'Chrome',
      extensionVersion: extensionVersion || '1.0.0',
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

  static async updateStatus(id, status) {
    const store = getStore();
    const user = store.users.get(id);
    if (user) {
      user.status = status;
      user.updatedAt = new Date();
      return this.sanitize(user);
    }
    return null;
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

// --- 3. Whitelist / Learning Channels Model ---
class WhitelistModel {
  static async listByUserId(userId) {
    const store = getStore();
    return Array.from(store.whitelist.values()).filter(w => w.userId === userId);
  }

  static async add({ userId, channelName, channelIdentifier, channelUrl, category = 'education', confidence = 95 }) {
    const store = getStore();
    const _id = 'wl_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    const item = {
      _id,
      userId,
      channelId: channelIdentifier || channelName.toLowerCase().replace(/\s+/g, ''),
      channelName,
      channelUrl: channelUrl || `https://www.youtube.com/@${encodeURIComponent(channelName)}`,
      category,
      confidence,
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
      completedSessions: all.filter(s => s.status === 'completed').length,
      interruptedSessions: all.filter(s => s.status === 'interrupted').length
    };
  }
}

// --- 5. Feature Flags Model ---
class FeatureFlagModel {
  static async listAll() {
    const store = getStore();
    return Array.from(store.featureFlags.values());
  }

  static async update(id, updates) {
    const store = getStore();
    const flag = store.featureFlags.get(id);
    if (flag) {
      Object.assign(flag, updates, { updatedAt: new Date() });
      return flag;
    }
    return null;
  }

  static async create({ name, key, enabled = false, rollout = 100, description }) {
    const store = getStore();
    const id = 'flag_' + key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const flag = {
      id,
      name,
      key,
      enabled: Boolean(enabled),
      rollout: Number(rollout) || 100,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.featureFlags.set(id, flag);
    return flag;
  }
}

// --- 6. Remote Config Model ---
class RemoteConfigModel {
  static async get() {
    const store = getStore();
    return store.remoteConfig;
  }

  static async update(updates) {
    const store = getStore();
    store.remoteConfig = { ...store.remoteConfig, ...updates, updatedAt: new Date() };
    return store.remoteConfig;
  }
}

// --- 7. Announcement Model ---
class AnnouncementModel {
  static async listAll() {
    const store = getStore();
    return Array.from(store.announcements.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  static async create({ title, content, type = 'feature', target = 'all' }) {
    const store = getStore();
    const _id = 'ann_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    const ann = {
      _id,
      title,
      content,
      type,
      target,
      active: true,
      createdAt: new Date()
    };
    store.announcements.set(_id, ann);
    return ann;
  }

  static async delete(id) {
    const store = getStore();
    return store.announcements.delete(id);
  }
}

// --- 8. Release Model ---
class ReleaseModel {
  static async listAll() {
    const store = getStore();
    return Array.from(store.releases.values()).sort((a, b) => b.releaseDate - a.releaseDate);
  }

  static async create({ version, status = 'stable', notes, minSupported = true }) {
    const store = getStore();
    const _id = 'rel_' + version.replace(/\./g, '_');
    const release = {
      _id,
      version,
      status,
      releaseDate: new Date(),
      installCount: 0,
      activeUsers: 0,
      minSupported: Boolean(minSupported),
      notes: notes || ''
    };
    store.releases.set(_id, release);
    return release;
  }
}

// --- 9. Audit Log Model ---
class AuditLogModel {
  static async listAll(limit = 100) {
    const store = getStore();
    return [...store.auditLogs].reverse().slice(0, limit);
  }

  static async log({ admin, adminEmail, action, details }) {
    const store = getStore();
    const entry = {
      _id: 'aud_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      admin: admin || 'Administrator',
      adminEmail: adminEmail || 'admin@knolect.app',
      action,
      details,
      timestamp: new Date()
    };
    store.auditLogs.push(entry);
    return entry;
  }
}

// --- 10. System Error Log Model ---
class SystemErrorLogModel {
  static async listAll() {
    const store = getStore();
    return Array.from(store.systemErrors.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  }

  static async log({ errorType, message, affectedVersion, browser }) {
    const store = getStore();
    const key = `${errorType}_${affectedVersion || '1.0.0'}`;
    if (store.systemErrors.has(key)) {
      const existing = store.systemErrors.get(key);
      existing.count++;
      existing.lastSeen = new Date();
      return existing;
    }

    const newError = {
      _id: 'err_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      errorType,
      message,
      affectedVersion: affectedVersion || '1.0.0',
      browser: browser || 'Chrome',
      count: 1,
      lastSeen: new Date(),
      resolved: false
    };
    store.systemErrors.set(key, newError);
    return newError;
  }
}

// --- 11. Feedback Model ---
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

  static async updateStatus(id, status, notes) {
    const store = getStore();
    const fb = store.feedback.get(id);
    if (fb) {
      fb.status = status;
      if (notes) fb.adminNotes = notes;
      fb.updatedAt = new Date();
      return fb;
    }
    return null;
  }
}

// --- 12. Bug Report Model ---
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

  static async updateStatus(id, status, notes) {
    const store = getStore();
    const bug = store.bugs.get(id);
    if (bug) {
      bug.status = status;
      if (notes) bug.adminNotes = notes;
      bug.updatedAt = new Date();
      return bug;
    }
    return null;
  }
}

// --- 13. Analytics Event Model (Privacy-First) ---
class AnalyticsEventModel {
  static async logEvent({ userId, eventName, metadata = {} }) {
    const store = getStore();
    // Safety check: Strip URLs, video titles, search terms to protect 100% user privacy
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
  FeatureFlagModel,
  RemoteConfigModel,
  AnnouncementModel,
  ReleaseModel,
  AuditLogModel,
  SystemErrorLogModel,
  FeedbackModel,
  BugReportModel,
  AnalyticsEventModel
};
