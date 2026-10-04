/**
 * Knolect Unified Local Server
 * Serves the official Knolect product website and backend REST API routes.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { createApp } = require('./backend/src/app');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const WEBSITE_DIR = path.join(__dirname, 'website');
const apiApp = createApp();

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = parsedUrl.pathname;

    // 1. Route API Requests to Backend App
    if (pathname.startsWith('/api')) {
      return apiApp.handle(req, res);
    }

    // 2. Route Static Website Files
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    } else if (pathname === '/install' || pathname === '/install/') {
      pathname = '/install.html';
    } else if (pathname === '/support' || pathname === '/support/') {
      pathname = '/support.html';
    } else if (pathname === '/admin' || pathname === '/admin/') {
      pathname = '/admin.html';
    } else if (pathname === '/dashboard' || pathname === '/dashboard/') {
      pathname = '/dashboard.html';
    } else if (!path.extname(pathname)) {
      const potentialHtml = path.join(WEBSITE_DIR, `${pathname}.html`);
      if (fs.existsSync(potentialHtml)) {
        pathname = `${pathname}.html`;
      }
    }

    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(WEBSITE_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>404 Not Found - Knolect</title>
            <link rel="stylesheet" href="/css/styles.css">
          </head>
          <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;background:#080c14;color:#f8fafc;font-family:sans-serif;">
            <div>
              <h1 style="font-size:3rem;margin-bottom:1rem;">404</h1>
              <p style="color:#94a3b8;margin-bottom:2rem;">Page not found</p>
              <a href="/" style="background:#10b981;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Return to Knolect</a>
            </div>
          </body>
          </html>
        `);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });

      const stream = fs.createReadStream(filePath);
      stream.on('error', (streamErr) => {
        console.error('[Server Stream Error]', streamErr);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      });
      stream.pipe(res);
    });
  } catch (e) {
    console.error('[Server Request Error]', e);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Server Error');
    }
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.warn(`[Server] Port ${PORT} is in use, trying port ${PORT + 1}...`);
    server.listen(PORT + 1);
  } else {
    console.error('[Server Error]', e);
  }
});

server.listen(PORT, () => {
  const address = server.address();
  const currentPort = address ? address.port : PORT;
  console.log(`\n======================================================`);
  console.log(`🛡️ Knolect Unified Server (Website + API) is live!`);
  console.log(`📡 URL: http://localhost:${currentPort}`);
  console.log(`📦 Install Guide: http://localhost:${currentPort}/install`);
  console.log(`💡 Support & Feedback: http://localhost:${currentPort}/support`);
  console.log(`📊 Admin Dashboard: http://localhost:${currentPort}/admin`);
  console.log(`🔗 REST API Base: http://localhost:${currentPort}/api`);
  console.log(`======================================================\n`);
});

module.exports = server;
