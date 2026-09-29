/**
 * BingeBlocker - Main Content Script
 * Initializes focus engine, handles YouTube SPA lifecycle events, and listens for extension messages.
 */

(function () {
  'use strict';

  // Prevent double injection
  if (window.__BINGEBLOCKER_INITIALIZED__) return;
  window.__BINGEBLOCKER_INITIALIZED__ = true;

  console.log('[BingeBlocker] Content script initialized on YouTube');

  const engine = new window.BingeBlockerFocusEngine();

  /**
   * Load initial state from storage and apply
   */
  async function init() {
    try {
      const data = await getStorageData(null);
      const focusMode = typeof data.focusMode === 'boolean' ? data.focusMode : false;
      const settings = data.settings || DEFAULT_STORAGE.settings;
      const whitelist = Array.isArray(data.whitelist) ? data.whitelist : DEFAULT_STORAGE.whitelist;

      await engine.updateState({ focusMode, settings, whitelist });
    } catch (err) {
      console.error('[BingeBlocker] Initialization error:', err);
    }
  }

  /**
   * Handle navigation and DOM updates
   */
  const handlePageChange = throttle(async () => {
    try {
      await engine.apply();
    } catch (e) {
      console.debug('[BingeBlocker] handlePageChange error:', e);
    }
  }, 150);

  // 1. YouTube SPA Lifecycle Events
  window.addEventListener('yt-navigate-finish', handlePageChange);
  window.addEventListener('yt-page-data-updated', handlePageChange);
  window.addEventListener('popstate', handlePageChange);
  window.addEventListener('spfdone', handlePageChange);

  // 2. MutationObserver for dynamic page segments
  const observer = new MutationObserver(
    debounce(() => {
      handlePageChange();
    }, 200)
  );

  function startObserver() {
    const target = document.querySelector('ytd-app') || document.body;
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    } else {
      setTimeout(startObserver, 300);
    }
  }

  // 3. Message Listener for Runtime Events
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return false;

    (async () => {
      try {
        switch (message.type) {
          case MESSAGE_TYPES.FOCUS_MODE_CHANGED: {
            await engine.updateState({ focusMode: message.focusMode });
            sendResponse({ success: true });
            break;
          }

          case MESSAGE_TYPES.SETTINGS_CHANGED: {
            await engine.updateState({ settings: message.settings });
            sendResponse({ success: true });
            break;
          }

          case MESSAGE_TYPES.WHITELIST_CHANGED: {
            await engine.updateState({ whitelist: message.whitelist });
            sendResponse({ success: true });
            break;
          }

          case MESSAGE_TYPES.QUERY_PAGE_STATUS: {
            const currentChannel = engine.detectCurrentChannel();
            const isWhitelisted = engine.isCurrentWhitelisted;
            const pathname = window.location.pathname;
            const isWatchPage = pathname.includes('/watch');
            const isHomePage = pathname === '/' || pathname === '';

            sendResponse({
              success: true,
              channel: currentChannel,
              isWhitelisted,
              isWatchPage,
              isHomePage,
              focusMode: engine.focusMode
            });
            break;
          }

          default:
            sendResponse({ success: true });
            break;
        }
      } catch (err) {
        console.error('[BingeBlocker Content] Error handling message:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();

    return true; // Keep response channel open for async response
  });

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      startObserver();
    });
  } else {
    init();
    startObserver();
  }
})();
