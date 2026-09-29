/**
 * BingeBlocker - Messaging Utilities
 * Standardized messaging wrapper for extension runtime and tabs.
 */

/**
 * Send a message to runtime (background service worker or popup)
 * @param {Object} message
 * @returns {Promise<any>}
 */
async function sendRuntimeMessage(message) {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            // Ignore benign "Receiving end does not exist" when popup is closed
            const errMsg = chrome.runtime.lastError.message || '';
            if (!errMsg.includes('Receiving end does not exist') && !errMsg.includes('Could not establish connection')) {
              console.debug('[BingeBlocker Messaging] sendRuntimeMessage notice:', errMsg);
            }
            resolve(null);
          } else {
            resolve(response);
          }
        });
      } else {
        resolve(null);
      }
    } catch (e) {
      console.debug('[BingeBlocker Messaging] Exception in sendRuntimeMessage:', e);
      resolve(null);
    }
  });
}

/**
 * Send a message to a specific tab
 * @param {number} tabId
 * @param {Object} message
 * @returns {Promise<any>}
 */
async function sendTabMessage(tabId, message) {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.sendMessage) {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            // Expected if tab is not a YouTube page or content script hasn't loaded yet
            resolve(null);
          } else {
            resolve(response);
          }
        });
      } else {
        resolve(null);
      }
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Broadcast a message to all YouTube tabs
 * @param {Object} message
 * @returns {Promise<void>}
 */
async function broadcastToYouTubeTabs(message) {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      const tabs = await chrome.tabs.query({ url: ['*://*.youtube.com/*'] });
      for (const tab of tabs) {
        if (tab.id) {
          await sendTabMessage(tab.id, message);
        }
      }
    }
  } catch (e) {
    console.debug('[BingeBlocker Messaging] Broadcast error:', e);
  }
}

// Attach to globalThis
if (typeof globalThis !== 'undefined') {
  globalThis.sendRuntimeMessage = sendRuntimeMessage;
  globalThis.sendTabMessage = sendTabMessage;
  globalThis.broadcastToYouTubeTabs = broadcastToYouTubeTabs;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendRuntimeMessage,
    sendTabMessage,
    broadcastToYouTubeTabs
  };
}
