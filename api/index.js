/**
 * Vercel Serverless Function Handler for Knolect REST API
 */

const { createApp } = require('../backend/src/app');

const app = createApp();

module.exports = (req, res) => {
  return app.handle(req, res);
};
