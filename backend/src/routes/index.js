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

  // --- Whitelist Routes ---
  app.get('/api/whitelist', requireAuth, whitelistController.getWhitelist);
  app.post('/api/whitelist', requireAuth, whitelistController.add);
  app.delete('/api/whitelist/:id', requireAuth, whitelistController.remove);

  // --- Session Routes ---
  app.post('/api/sessions', optionalAuth, sessionController.create);
  app.get('/api/sessions', requireAuth, sessionController.list);
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

  // --- Admin Panel Endpoints (Role Protected) ---
  app.get('/api/admin/overview', requireAdmin, adminController.getOverview);
  app.get('/api/admin/users', requireAdmin, adminController.getUsers);
  app.get('/api/admin/health', adminController.getSystemHealth);
}

module.exports = registerRoutes;
