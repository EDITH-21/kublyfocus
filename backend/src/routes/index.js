/**
 * Knolect Express REST API Routes
 */

const {
  authController,
  userController,
  whitelistController,
  sessionController,
  feedbackController,
  bugController,
  analyticsController,
  adminController
} = require('../controllers');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');

function registerRoutes(app) {
  // --- Auth Routes ---
  app.post('/api/auth/register', authController.register);
  app.post('/api/auth/login', authController.login);
  app.get('/api/auth/me', requireAuth, authController.me);

  // --- User & Settings Routes ---
  app.get('/api/user/settings', requireAuth, userController.getSettings);
  app.patch('/api/user/settings', requireAuth, userController.updateSettings);
  app.get('/api/user/dashboard', requireAuth, userController.getDashboardData);

  // --- Whitelist / Learning Channels Routes ---
  app.get('/api/whitelist', requireAuth, whitelistController.getWhitelist);
  app.post('/api/whitelist', requireAuth, whitelistController.add);
  app.delete('/api/whitelist/:id', requireAuth, whitelistController.remove);

  // --- Session Routes ---
  app.post('/api/sessions', optionalAuth, sessionController.create);
  app.get('/api/sessions', requireAuth, sessionController.getMySessions);
  app.get('/api/sessions/stats', sessionController.getStats);

  // --- Feedback Routes ---
  app.post('/api/feedback', optionalAuth, feedbackController.submit);
  app.get('/api/feedback', requireAdmin, feedbackController.list);
  app.patch('/api/feedback/:id', requireAdmin, feedbackController.updateStatus);

  // --- Bug Reports Routes ---
  app.post('/api/bugs', optionalAuth, bugController.submit);
  app.get('/api/bugs', requireAdmin, bugController.list);
  app.patch('/api/bugs/:id', requireAdmin, bugController.updateStatus);

  // --- Analytics Routes (Privacy-Safe) ---
  app.post('/api/analytics/events', optionalAuth, analyticsController.logEvent);
  app.get('/api/analytics/summary', requireAdmin, analyticsController.getSummary);

  // --- Admin Control Center Endpoints (Role Protected) ---
  app.get('/api/admin/overview', requireAdmin, adminController.getOverview);
  app.get('/api/admin/users', requireAdmin, adminController.getUsers);
  app.get('/api/admin/users/:id', requireAdmin, adminController.getUserDetail);
  app.patch('/api/admin/users/:id/status', requireAdmin, adminController.updateUserStatus);
  
  // Feature Flags
  app.get('/api/admin/feature-flags', requireAdmin, adminController.getFeatureFlags);
  app.patch('/api/admin/feature-flags/:id', requireAdmin, adminController.updateFeatureFlag);
  
  // Remote Configuration
  app.get('/api/admin/remote-config', requireAdmin, adminController.getRemoteConfig);
  app.patch('/api/admin/remote-config', requireAdmin, adminController.updateRemoteConfig);
  
  // Announcements
  app.get('/api/admin/announcements', requireAdmin, adminController.getAnnouncements);
  app.post('/api/admin/announcements', requireAdmin, adminController.createAnnouncement);
  app.delete('/api/admin/announcements/:id', requireAdmin, adminController.deleteAnnouncement);
  
  // Releases & Errors & Audits
  app.get('/api/admin/releases', requireAdmin, adminController.getReleases);
  app.post('/api/admin/releases', requireAdmin, adminController.createRelease);
  app.get('/api/admin/error-logs', requireAdmin, adminController.getErrorLogs);
  app.get('/api/admin/audit-logs', requireAdmin, adminController.getAuditLogs);
  app.get('/api/admin/health', adminController.getSystemHealth);
  app.get('/api/health', adminController.getSystemHealth);
}

module.exports = registerRoutes;
