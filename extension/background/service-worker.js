/**
 * Knolect - Background Service Worker (Manifest V3)
 * Manages timer alarms, action badge state, storage synchronization, and message routing.
 */

// Import shared scripts
try {
  importScripts(
    '../utils/constants.js',
    '../utils/helpers.js',
    '../storage/storage.js',
    '../utils/messaging.js'
  );
} catch (e) {
  console.error('[Knolect Service Worker] Failed to import helper scripts:', e);
}

const TIMER_ALARM_NAME = 'KNOLECT_TIMER_ALARM';

/**
 * Update the Extension Action badge to reflect Focus Mode & Timer state
 */
async function updateExtensionBadge() {
  try {
    const focusMode = await getFocusMode();
    const strictFocus = await getStrictFocus();
    const timer = await getTimerState();

    if (!focusMode) {
      await chrome.action.setBadgeText({ text: '' });
      return;
    }

    if (timer.running && timer.remaining > 0) {
      const minutes = Math.ceil(timer.remaining / 60);
      const text = `${minutes}m`;
      await chrome.action.setBadgeText({ text });
      await chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' }); // Blue for active timer
    } else if (strictFocus) {
      await chrome.action.setBadgeText({ text: 'STRICT' });
      await chrome.action.setBadgeBackgroundColor({ color: '#10b981' }); // Green for Strict Focus
    } else {
      await chrome.action.setBadgeText({ text: 'ON' });
      await chrome.action.setBadgeBackgroundColor({ color: '#10b981' }); // Green for Focus active
    }
  } catch (err) {
    console.debug('[Knolect Service Worker] Badge update notice:', err);
  }
}

/**
 * Synchronize timer state with alarms
 */
async function syncTimerState() {
  const timer = await getTimerState();
  if (timer.running && timer.endTime) {
    const now = Date.now();
    if (timer.endTime <= now) {
      await handleTimerCompletion();
    } else {
      await chrome.alarms.create(TIMER_ALARM_NAME, { when: timer.endTime });
    }
  } else {
    await chrome.alarms.clear(TIMER_ALARM_NAME);
  }
  await updateExtensionBadge();
}

/**
 * Handle timer finish event
 */
async function handleTimerCompletion() {
  const settings = await getSettings();
  const duration = settings.defaultTimerDuration || 1500;

  const timer = {
    duration,
    remaining: 0,
    running: false,
    endTime: null
  };

  await setStorageData({ timer });
  await chrome.alarms.clear(TIMER_ALARM_NAME);
  await updateExtensionBadge();

  // Broadcast timer finished to tabs and popup
  await broadcastToYouTubeTabs({ type: MESSAGE_TYPES.TIMER_FINISHED, timer });
  await sendRuntimeMessage({ type: MESSAGE_TYPES.TIMER_FINISHED, timer });
}

// Lifecycle Listeners
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Knolect] Extension installed/updated:', details.reason);
  await initStorageDefaults();
  await updateExtensionBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[Knolect] Browser startup');
  await syncTimerState();
  await updateExtensionBadge();
});

// Alarm Listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === TIMER_ALARM_NAME) {
    await handleTimerCompletion();
  }
});

// Watch storage changes to keep badge updated
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.focusMode || changes.strictFocus || changes.timer) {
      updateExtensionBadge();
    }
  }
});

// Central Message Routing Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  (async () => {
    try {
      switch (message.type) {
        // --- Focus Mode ---
        case MESSAGE_TYPES.GET_FOCUS_MODE: {
          const focusMode = await getFocusMode();
          sendResponse({ success: true, focusMode });
          break;
        }

        case MESSAGE_TYPES.TOGGLE_FOCUS_MODE: {
          const enabled = typeof message.enabled === 'boolean' ? message.enabled : !(await getFocusMode());
          await setFocusMode(enabled);
          await updateExtensionBadge();
          await broadcastToYouTubeTabs({ type: MESSAGE_TYPES.FOCUS_MODE_CHANGED, focusMode: enabled });
          sendResponse({ success: true, focusMode: enabled });
          break;
        }

        // --- Strict Focus Mode ---
        case MESSAGE_TYPES.GET_STRICT_FOCUS: {
          const strictFocus = await getStrictFocus();
          sendResponse({ success: true, strictFocus });
          break;
        }

        case MESSAGE_TYPES.TOGGLE_STRICT_FOCUS: {
          const enabled = typeof message.enabled === 'boolean' ? message.enabled : !(await getStrictFocus());
          await setStrictFocus(enabled);
          await updateExtensionBadge();
          await broadcastToYouTubeTabs({ type: MESSAGE_TYPES.STRICT_FOCUS_CHANGED, strictFocus: enabled });
          sendResponse({ success: true, strictFocus: enabled });
          break;
        }

        // --- Timer ---
        case MESSAGE_TYPES.GET_TIMER: {
          const timer = await getTimerState();
          sendResponse({ success: true, timer });
          break;
        }

        case MESSAGE_TYPES.START_TIMER: {
          let timer = await getTimerState();
          const remaining = timer.remaining > 0 ? timer.remaining : timer.duration;
          const endTime = Date.now() + remaining * 1000;

          timer.running = true;
          timer.remaining = remaining;
          timer.endTime = endTime;

          await setStorageData({ timer });
          await chrome.alarms.create(TIMER_ALARM_NAME, { when: endTime });
          await updateExtensionBadge();

          await broadcastToYouTubeTabs({ type: MESSAGE_TYPES.TIMER_UPDATED, timer });
          sendResponse({ success: true, timer });
          break;
        }

        case MESSAGE_TYPES.PAUSE_TIMER: {
          let timer = await getTimerState();
          if (timer.running && timer.endTime) {
            const remainingMs = timer.endTime - Date.now();
            timer.remaining = Math.max(0, Math.ceil(remainingMs / 1000));
          }
          timer.running = false;
          timer.endTime = null;

          await setStorageData({ timer });
          await chrome.alarms.clear(TIMER_ALARM_NAME);
          await updateExtensionBadge();

          await broadcastToYouTubeTabs({ type: MESSAGE_TYPES.TIMER_UPDATED, timer });
          sendResponse({ success: true, timer });
          break;
        }

        case MESSAGE_TYPES.RESET_TIMER: {
          const settings = await getSettings();
          const duration = message.duration || settings.defaultTimerDuration || 1500;

          const timer = {
            duration,
            remaining: duration,
            running: false,
            endTime: null
          };

          await setStorageData({ timer });
          await chrome.alarms.clear(TIMER_ALARM_NAME);
          await updateExtensionBadge();

          await broadcastToYouTubeTabs({ type: MESSAGE_TYPES.TIMER_UPDATED, timer });
          sendResponse({ success: true, timer });
          break;
        }

        case MESSAGE_TYPES.SET_TIMER_DURATION: {
          const duration = Number(message.duration) || 1500;
          let timer = await getTimerState();

          timer.duration = duration;
          if (!timer.running) {
            timer.remaining = duration;
            timer.endTime = null;
          }

          await setStorageData({ timer });
          sendResponse({ success: true, timer });
          break;
        }

        // --- Whitelist ---
        case MESSAGE_TYPES.GET_WHITELIST: {
          const whitelist = await getWhitelist();
          sendResponse({ success: true, whitelist });
          break;
        }

        case MESSAGE_TYPES.ADD_WHITELIST: {
          const result = await addWhitelistChannel(message.channel);
          if (result.success) {
            await broadcastToYouTubeTabs({ type: MESSAGE_TYPES.WHITELIST_CHANGED, whitelist: result.whitelist });
          }
          sendResponse(result);
          break;
        }

        case MESSAGE_TYPES.REMOVE_WHITELIST: {
          const result = await removeWhitelistChannel(message.idOrIdentifier);
          if (result.success) {
            await broadcastToYouTubeTabs({ type: MESSAGE_TYPES.WHITELIST_CHANGED, whitelist: result.whitelist });
          }
          sendResponse(result);
          break;
        }

        case MESSAGE_TYPES.CHECK_WHITELIST: {
          const isWhitelisted = await isChannelWhitelisted(message.channel);
          sendResponse({ success: true, isWhitelisted });
          break;
        }

        // --- Settings ---
        case MESSAGE_TYPES.GET_SETTINGS: {
          const settings = await getSettings();
          sendResponse({ success: true, settings });
          break;
        }

        case MESSAGE_TYPES.UPDATE_SETTINGS: {
          await saveSettings(message.settings);
          const updated = await getSettings();
          await broadcastToYouTubeTabs({ type: MESSAGE_TYPES.SETTINGS_CHANGED, settings: updated });
          sendResponse({ success: true, settings: updated });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
          break;
      }
    } catch (err) {
      console.error('[Knolect Service Worker] Error processing message:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  return true;
});
