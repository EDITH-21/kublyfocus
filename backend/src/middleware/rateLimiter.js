/**
 * Knolect Rate Limiter & Error Handling Middleware
 */

const ipHits = new Map();

function rateLimiter({ windowMs = 60000, max = 120 } = {}) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!ipHits.has(ip)) {
      ipHits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = ipHits.get(ip);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count++;
    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }

    next();
  };
}

function errorHandler(err, req, res, next) {
  console.error('[Knolect API Error]', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
}

module.exports = {
  rateLimiter,
  errorHandler
};
