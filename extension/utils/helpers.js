/**
 * Knolect - Helper Utilities
 * Pure helper functions for formatting, channel identification, timing, and security.
 */

// Debug flag: Set to false for production beta, true for developer inspection
const KNOLECT_DEBUG_MODE = false;

/**
 * Development-only structured debug logger
 * @param {string} tag 
 * @param {any} data 
 */
function knolectDebug(tag, data) {
  if (typeof globalThis !== 'undefined' && globalThis.__KNOLECT_DEBUG__) {
    console.log(`%c[KNOLECT DEBUG] ${tag}`, 'background:#0f172a;color:#10b981;font-weight:bold;padding:2px 6px;border-radius:4px;', data);
  }
}

/**
 * Format seconds into MM:SS or HH:MM:SS
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatSeconds(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Normalize channel identifier (handle, URL, channelId, or name)
 * Resolves variations like:
 * - "PW-Foundation" -> handle: "@PW-Foundation", normalizedHandle: "pw-foundation", identifier: "@pw-foundation"
 * - "https://www.youtube.com/@3blue1brown" -> handle: "@3blue1brown", normalizedHandle: "3blue1brown"
 * - "https://youtube.com/channel/UC..." -> channelId: "UC...", identifier: "uc..."
 * @param {string|object} input
 * @returns {{ name: string, identifier: string, handle: string, normalizedHandle: string, channelId: string }}
 */
function normalizeChannelInfo(input) {
  if (!input) {
    return { name: '', identifier: '', handle: '', normalizedHandle: '', channelId: '' };
  }

  let raw = '';
  let channelId = '';
  let handle = '';
  let name = '';

  if (typeof input === 'object') {
    raw = input.url || input.handle || input.identifier || input.name || '';
    channelId = (input.channelId || '').trim();
    handle = (input.handle || '').trim();
    name = (input.name || '').trim();
  } else {
    raw = String(input).trim();
  }

  // URL Parsing
  if (raw.includes('youtube.com/') || raw.includes('youtu.be/')) {
    try {
      const urlObj = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      const pathname = urlObj.pathname.replace(/\/$/, '');
      const parts = pathname.split('/').filter(Boolean);

      if (parts[0] && parts[0].startsWith('@')) {
        handle = parts[0];
        if (!name) name = handle.slice(1);
      } else if (parts[0] === 'channel' && parts[1]) {
        channelId = parts[1];
        if (!name) name = channelId;
      } else if ((parts[0] === 'c' || parts[0] === 'user') && parts[1]) {
        if (!name) name = parts[1];
      } else if (parts[0]) {
        if (parts[0].startsWith('@')) handle = parts[0];
        if (!name) name = parts[0];
      }
    } catch (e) {}
  } else if (raw.startsWith('@')) {
    handle = raw;
    if (!name) name = raw.slice(1);
  } else if (/^UC[\w-]{21,23}$/.test(raw)) {
    channelId = raw;
    if (!name) name = raw;
  } else if (!name) {
    name = raw;
  }

  if (handle && !handle.startsWith('@')) {
    handle = `@${handle}`;
  }

  const normalizedHandle = (handle || '').replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const identifier = channelId 
    ? channelId.toLowerCase()
    : (handle ? handle.toLowerCase() : (normalizedHandle ? `@${normalizedHandle}` : (name ? name.toLowerCase().replace(/\s+/g, '') : '')));

  return {
    name: name || (handle ? handle.slice(1) : channelId || raw),
    identifier: identifier || raw.toLowerCase(),
    handle: handle || (normalizedHandle ? `@${normalizedHandle}` : ''),
    normalizedHandle,
    channelId: channelId || ''
  };
}

/**
 * Safe HTML string escaping to prevent XSS injection in UI
 * @param {string} str 
 * @returns {string}
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Debounce a function call
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
function debounce(func, wait = 100) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function call
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
function throttle(func, limit = 100) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Global scope attachment
if (typeof globalThis !== 'undefined') {
  globalThis.formatSeconds = formatSeconds;
  globalThis.normalizeChannelInfo = normalizeChannelInfo;
  globalThis.escapeHtml = escapeHtml;
  globalThis.debounce = debounce;
  globalThis.throttle = throttle;
  globalThis.knolectDebug = knolectDebug;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatSeconds,
    normalizeChannelInfo,
    escapeHtml,
    debounce,
    throttle,
    knolectDebug
  };
}
