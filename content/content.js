/**
 * Knolect - Main Content Script
 * Initializes focus engine, handles YouTube SPA lifecycle events,
 * and intercepts dynamic navigations for Strict Focus enforcement.
 */

(function () {
  'use strict';

  if (window.__KNOLECT_INITIALIZED__) return;
  window.__KNOLECT_INITIALIZED__ = true;

  console.log('[Knolect] Focus Mode content script active on YouTube');

  const engine = new window.KnolectFocusEngine();

  /**
   * Load initial state from storage and apply
   */
  async function init() {
    try {
      const data = await getStorageData(null);
      const focusMode = typeof data.focusMode === 'boolean' ? data.focusMode : true;
      const strictFocus = typeof data.strictFocus === 'boolean' ? data.strictFocus : true;
      const settings = data.settings || DEFAULT_STORAGE.settings;
      const whitelist = Array.isArray(data.whitelist) ? data.whitelist : DEFAULT_STORAGE.whitelist;

      await engine.updateState({ focusMode, strictFocus, settings, whitelist });
    } catch (err) {
      console.error('[Knolect] Initialization error:', err);
    }
  }

  /**
   * Handle page navigation & DOM changes
   */
  const handlePageChange = throttle(async () => {
    try {
      await engine.apply();
    } catch (e) {
      console.debug('[Knolect] handlePageChange notice:', e);
    }
  }, 100);

  // 1. YouTube SPA Lifecycle Events
  window.addEventListener('yt-navigate-finish', handlePageChange);
  window.addEventListener('yt-page-data-updated', handlePageChange);
  window.addEventListener('popstate', handlePageChange);
  window.addEventListener('spfdone', handlePageChange);

  // 2. Intercept History pushState / replaceState
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    handlePageChange();
    return result;
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    handlePageChange();
    return result;
  };

  // 3. MutationObserver for dynamic page transitions & late-loading channel names
  const observer = new MutationObserver(
    debounce(() => {
      handlePageChange();
    }, 150)
  );

  function startObserver() {
    const target = document.querySelector('ytd-app') || document.body;
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    } else {
      setTimeout(startObserver, 200);
    }
  }

  // 4. Runtime Message Listener
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

          case MESSAGE_TYPES.STRICT_FOCUS_CHANGED: {
            await engine.updateState({ strictFocus: message.strictFocus });
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

          case MESSAGE_TYPES.FORCE_REAPPLY: {
            await engine.apply();
            sendResponse({ success: true });
            break;
          }

          case MESSAGE_TYPES.QUERY_PAGE_STATUS: {
            const currentChannel = engine.detectCurrentChannel();
            const isWhitelisted = engine.isCurrentWhitelisted;
            const pathname = window.location.pathname;
            const isWatchPage = pathname.includes('/watch');
            const isHomePage = pathname === '/' || pathname === '';
            const isSearchPage = pathname.startsWith('/results');

            sendResponse({
              success: true,
              channel: currentChannel,
              isWhitelisted,
              isWatchPage,
              isHomePage,
              isSearchPage,
              focusMode: engine.focusMode,
              strictFocus: engine.strictFocus
            });
            break;
          }

          default:
            sendResponse({ success: true });
            break;
        }
      } catch (err) {
        console.error('[Knolect Content] Error handling message:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();

    return true; // Keep channel open for async response
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
