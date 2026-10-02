/**
 * BingeBlocker - Helper Utilities
 * Pure helper functions for formatting, channel identification, and timing.
 */

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
 * Normalize channel identifier (handle, URL, or channel name)
 * @param {string} input
 * @returns {{ name: string, identifier: string, handle: string }}
 */
function normalizeChannelInfo(input) {
  if (!input || typeof input !== 'string') {
    return { name: '', identifier: '', handle: '' };
  }

  const trimmed = input.trim();
  let handle = '';
  let identifier = trimmed.toLowerCase();
  let name = trimmed;

  // Extract from URL (e.g., https://www.youtube.com/@ChannelName or youtube.com/c/ChannelName)
  try {
    if (trimmed.includes('youtube.com/') || trimmed.includes('youtu.be/')) {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const pathname = url.pathname.replace(/\/$/, '');
      const parts = pathname.split('/').filter(Boolean);

      if (parts[0] && parts[0].startsWith('@')) {
        handle = parts[0];
        identifier = handle.toLowerCase();
        name = handle.slice(1);
      } else if (parts[0] === 'channel' && parts[1]) {
        identifier = parts[1].toLowerCase();
        name = parts[1];
      } else if ((parts[0] === 'c' || parts[0] === 'user') && parts[1]) {
        identifier = parts[1].toLowerCase();
        name = parts[1];
      } else if (parts[0]) {
        identifier = parts[0].toLowerCase();
        name = parts[0];
      }
    } else if (trimmed.startsWith('@')) {
      handle = trimmed;
      identifier = trimmed.toLowerCase();
      name = trimmed.slice(1);
    }
  } catch (e) {
    // Fallback on simple string handling
    if (trimmed.startsWith('@')) {
      handle = trimmed;
      identifier = trimmed.toLowerCase();
      name = trimmed.slice(1);
    }
  }

  return {
    name: name || trimmed,
    identifier: identifier || trimmed.toLowerCase(),
    handle: handle || (trimmed.startsWith('@') ? trimmed : '')
  };
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
function throttle(func, limit = 200) {
  let inThrottle = false;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Safely query an element with fallback
 * @param {string} selector
 * @param {Document|Element} parent
 * @returns {Element|null}
 */
function safeQuery(selector, parent = document) {
  try {
    return parent.querySelector(selector);
  } catch (e) {
    return null;
  }
}

/**
 * Safely query all matching elements
 * @param {string} selector
 * @param {Document|Element} parent
 * @returns {Element[]}
 */
function safeQueryAll(selector, parent = document) {
  try {
    return Array.from(parent.querySelectorAll(selector));
  } catch (e) {
    return [];
  }
}

// Attach to globalThis
if (typeof globalThis !== 'undefined') {
  globalThis.formatSeconds = formatSeconds;
  globalThis.normalizeChannelInfo = normalizeChannelInfo;
  globalThis.debounce = debounce;
  globalThis.throttle = throttle;
  globalThis.safeQuery = safeQuery;
  globalThis.safeQueryAll = safeQueryAll;
}

// Export for node/browser contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatSeconds,
    normalizeChannelInfo,
    debounce,
    throttle,
    safeQuery,
    safeQueryAll
  };
}
