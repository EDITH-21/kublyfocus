/**
 * Knolect Express Application Configuration
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const dbConfig = require('./config/db');
const registerRoutes = require('./routes');
const { rateLimiter, errorHandler } = require('./middleware/rateLimiter');

// Initialize database engine
dbConfig.connect();

// Lightweight request parser & router
function createApp() {
  const routes = [];

  const app = {
    get(path, ...handlers) {
      routes.push({ method: 'GET', path, handlers });
    },
    post(path, ...handlers) {
      routes.push({ method: 'POST', path, handlers });
    },
    patch(path, ...handlers) {
      routes.push({ method: 'PATCH', path, handlers });
    },
    delete(path, ...handlers) {
      routes.push({ method: 'DELETE', path, handlers });
    },

    async handle(req, res) {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // JSON helper
      res.json = (data) => {
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json; charset=UTF-8');
          res.end(JSON.stringify(data));
        }
      };

      res.status = (code) => {
        res.statusCode = code;
        return res;
      };

      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;
      req.query = Object.fromEntries(parsedUrl.searchParams.entries());

      // Read Body for POST/PATCH
      let bodyData = '';
      req.on('data', chunk => {
        bodyData += chunk;
      });

      req.on('end', async () => {
        if (bodyData) {
          try {
            req.body = JSON.parse(bodyData);
          } catch (e) {
            req.body = {};
          }
        } else {
          req.body = {};
        }

        // Match route
        for (const route of routes) {
          if (route.method !== req.method) continue;

          // Simple path match with :id support
          const routeParts = route.path.split('/').filter(Boolean);
          const pathParts = pathname.split('/').filter(Boolean);

          if (routeParts.length !== pathParts.length) continue;

          let matches = true;
          const params = {};

          for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
              const paramName = routeParts[i].slice(1);
              params[paramName] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
              matches = false;
              break;
            }
          }

          if (matches) {
            req.params = params;
            // Execute handlers pipeline
            let index = 0;
            const next = async (err) => {
              if (err) return errorHandler(err, req, res);
              if (index < route.handlers.length) {
                const handler = route.handlers[index++];
                try {
                  await handler(req, res, next);
                } catch (handlerErr) {
                  errorHandler(handlerErr, req, res);
                }
              }
            };
            return next();
          }
        }

        // 404 for unmatched API route
        if (pathname.startsWith('/api')) {
          res.status(404).json({ success: false, error: 'API endpoint not found' });
          return;
        }

        // Static file serving fallback for website
        return false;
      });
    }
  };

  registerRoutes(app);
  return app;
}

module.exports = { createApp };
