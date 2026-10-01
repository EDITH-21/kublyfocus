/**
 * Knolect Backend Server Entry Point
 */

const http = require('http');
const { createApp } = require('./src/app');

const PORT = parseInt(process.env.PORT, 10) || 4000;
const app = createApp();

const server = http.createServer((req, res) => {
  app.handle(req, res);
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🛡️ Knolect Backend REST API is running!`);
  console.log(`📡 Port: http://localhost:${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`======================================================\n`);
});

module.exports = server;
