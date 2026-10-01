/**
 * Knolect API Controllers
 */

const {
  UserModel,
  UserSettingsModel,
  WhitelistModel,
  SessionModel,
  FeedbackModel,
  BugReportModel,
  AnalyticsEventModel
} = require('../models');
const { generateToken } = require('../middleware/auth');

// --- 1. Auth Controller ---
const authController = {
  async register(req, res) {
    try {
      const { email, name, password } = req.body || {};
      if (!email || !name || !password) {
        return res.status(400).json({ success: false, error: 'Email, name, and password are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      }

      const user = await UserModel.create({ email, name, password });
      const token = generateToken({ id: user._id, role: user.role });
      res.status(201).json({ success: true, user, token });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user || !UserModel.verifyPassword(user, password)) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const safeUser = UserModel.sanitize(user);
      const token = generateToken({ id: safeUser._id, role: safeUser.role });
      res.json({ success: true, user: safeUser, token });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async me(req, res) {
    res.json({ success: true, user: req.user });
  }
};

// --- 2. User & Settings Controller ---
const userController = {
  async getSettings(req, res) {
    try {
      const settings = await UserSettingsModel.getByUserId(req.user._id);
      res.json({ success: true, settings });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateSettings(req, res) {
    try {
      const settings = await UserSettingsModel.updateByUserId(req.user._id, req.body || {});
      res.json({ success: true, settings });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

// --- 3. Whitelist Controller ---
const whitelistController = {
  async getWhitelist(req, res) {
    try {
      const list = await WhitelistModel.listByUserId(req.user._id);
      res.json({ success: true, whitelist: list });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async add(req, res) {
    try {
      const { channelName, channelIdentifier, channelUrl } = req.body || {};
      if (!channelName) {
        return res.status(400).json({ success: false, error: 'Channel name is required' });
      }
      const item = await WhitelistModel.add({
        userId: req.user._id,
        channelName,
        channelIdentifier,
        channelUrl
      });
      res.status(201).json({ success: true, channel: item });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const success = await WhitelistModel.remove(req.params.id, req.user._id);
      if (success) {
        res.json({ success: true, message: 'Channel removed from whitelist' });
      } else {
        res.status(404).json({ success: false, error: 'Channel not found or unauthorized' });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

// --- 4. Sessions Controller ---
const sessionController = {
  async create(req, res) {
    try {
      const { duration, status } = req.body || {};
      const session = await SessionModel.create({
        userId: req.user ? req.user._id : 'anonymous',
        duration,
        status
      });
      res.status(201).json({ success: true, session });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async list(req, res) {
    try {
      const sessions = await SessionModel.listByUserId(req.user._id);
      res.json({ success: true, sessions });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getStats(req, res) {
    try {
      const stats = await SessionModel.getStats();
      res.json({ success: true, stats });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

// --- 5. Feedback Controller ---
const feedbackController = {
  async submit(req, res) {
    try {
      const { message, type } = req.body || {};
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Feedback message is required' });
      }
      const fb = await FeedbackModel.create({
        userId: req.user ? req.user._id : 'guest',
        type,
        message
      });
      res.status(201).json({ success: true, feedback: fb, message: 'Thank you for your feedback!' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async list(req, res) {
    try {
      const items = await FeedbackModel.listAll();
      res.json({ success: true, feedback: items });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status } = req.body || {};
      const updated = await FeedbackModel.updateStatus(req.params.id, status);
      if (updated) {
        res.json({ success: true, feedback: updated });
      } else {
        res.status(404).json({ success: false, error: 'Feedback record not found' });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

// --- 6. Bug Reports Controller ---
const bugController = {
  async submit(req, res) {
    try {
      const { title, description, browser, extensionVersion } = req.body || {};
      if (!title || !description) {
        return res.status(400).json({ success: false, error: 'Title and description are required' });
      }
      const bug = await BugReportModel.create({
        userId: req.user ? req.user._id : 'guest',
        title,
        description,
        browser,
        extensionVersion
      });
      res.status(201).json({ success: true, bug, message: 'Bug report submitted. Thank you for helping improve Knolect!' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async list(req, res) {
    try {
      const bugs = await BugReportModel.listAll();
      res.json({ success: true, bugs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status } = req.body || {};
      const updated = await BugReportModel.updateStatus(req.params.id, status);
      if (updated) {
        res.json({ success: true, bug: updated });
      } else {
        res.status(404).json({ success: false, error: 'Bug report not found' });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

// --- 7. Analytics Controller ---
const analyticsController = {
  async logEvent(req, res) {
    try {
      const { eventName, metadata } = req.body || {};
      if (!eventName) {
        return res.status(400).json({ success: false, error: 'Event name is required' });
      }
      const event = await AnalyticsEventModel.logEvent({
        userId: req.user ? req.user._id : 'anonymous',
        eventName,
        metadata
      });
      res.status(201).json({ success: true, event });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getSummary(req, res) {
    try {
      const summary = await AnalyticsEventModel.getSummary();
      res.json({ success: true, summary });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

// --- 8. Admin Controller ---
const adminController = {
  async getOverview(req, res) {
    try {
      const users = await UserModel.listAll();
      const stats = await SessionModel.getStats();
      const feedback = await FeedbackModel.listAll();
      const bugs = await BugReportModel.listAll();
      const analytics = await AnalyticsEventModel.getSummary();

      res.json({
        success: true,
        overview: {
          totalUsers: users.length,
          activeUsers: users.filter(u => u.status === 'active').length,
          totalSessions: stats.totalSessions,
          totalFocusMinutes: stats.totalFocusMinutes,
          openFeedback: feedback.filter(f => f.status === 'open').length,
          openBugs: bugs.filter(b => b.status === 'open').length,
          totalAnalyticsEvents: analytics.totalEvents
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getUsers(req, res) {
    try {
      const users = await UserModel.listAll();
      res.json({ success: true, users });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getSystemHealth(req, res) {
    res.json({
      success: true,
      system: {
        status: 'healthy',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        extensionVersion: '1.0.0',
        timestamp: new Date()
      }
    });
  }
};

module.exports = {
  authController,
  userController,
  whitelistController,
  sessionController,
  feedbackController,
  bugController,
  analyticsController,
  adminController
};
