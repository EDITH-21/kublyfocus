/**
 * BingeBlocker - Storage Layer
 * Centralized async wrapper around chrome.storage.local with defaults and robust fallback.
 */

// In environments where constants are loaded via script tag vs module
const _DEFAULTS = (typeof DEFAULT_STORAGE !== 'undefined') ? DEFAULT_STORAGE : {
  focusMode: false,
  whitelist: [
    { id: 'mit-ocw', name: 'MIT OpenCourseWare', identifier: '@mitocw', addedAt: 1700000000000 },
    { id: '3blue1brown', name: '3Blue1Brown', identifier: '@3blue1brown', addedAt: 1700000000000 },
    { id: 'freecodecamp', name: 'freeCodeCamp.org', identifier: '@freecodecamp', addedAt: 1700000000000 },
    { id: 'khanacademy', name: 'Khan Academy', identifier: '@khanacademy', addedAt: 1700000000000 }
  ],
  settings: {
    hideShorts: true,
    hideComments: true,
    hideRecommendations: true,
    hideHomeFeed: true,
    hideEndScreen: true,
    defaultTimerDuration: 1500
  },
  timer: {
    duration: 1500,
    remaining: 1500,
    running: false,
    endTime: null
  }
};

/**
 * Low-level storage getter
 * @param {string|string[]|Object|null} keys
 * @returns {Promise<Object>}
 */
async function getStorageData(keys = null) {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            console.error('[BingeBlocker Storage] Error reading storage:', chrome.runtime.lastError);
            resolve({});
          } else {
            resolve(result || {});
          }
        });
      } else {
        console.warn('[BingeBlocker Storage] chrome.storage.local not available');
        resolve({});
      }
    } catch (err) {
      console.error('[BingeBlocker Storage] Exception in getStorageData:', err);
      resolve({});
    }
  });
}

/**
 * Low-level storage setter
 * @param {Object} items
 * @returns {Promise<boolean>}
 */
async function setStorageData(items) {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(items, () => {
          if (chrome.runtime.lastError) {
            console.error('[BingeBlocker Storage] Error writing storage:', chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      } else {
        console.warn('[BingeBlocker Storage] chrome.storage.local not available');
        resolve(false);
      }
    } catch (err) {
      console.error('[BingeBlocker Storage] Exception in setStorageData:', err);
      resolve(false);
    }
  });
}

/**
 * Initialize default storage data if missing
 * @returns {Promise<Object>}
 */
async function initStorageDefaults() {
  const current = await getStorageData(null);
  const updates = {};
  let needsUpdate = false;

  if (typeof current.focusMode === 'undefined') {
    updates.focusMode = _DEFAULTS.focusMode;
    needsUpdate = true;
  }
  if (!Array.isArray(current.whitelist)) {
    updates.whitelist = _DEFAULTS.whitelist;
    needsUpdate = true;
  }
  if (!current.settings || typeof current.settings !== 'object') {
    updates.settings = _DEFAULTS.settings;
    needsUpdate = true;
  } else {
    // Ensure all individual settings exist
    const mergedSettings = { ..._DEFAULTS.settings, ...current.settings };
    if (JSON.stringify(mergedSettings) !== JSON.stringify(current.settings)) {
      updates.settings = mergedSettings;
      needsUpdate = true;
    }
  }
  if (!current.timer || typeof current.timer !== 'object') {
    updates.timer = _DEFAULTS.timer;
    needsUpdate = true;
  } else {
    const mergedTimer = { ..._DEFAULTS.timer, ...current.timer };
    if (JSON.stringify(mergedTimer) !== JSON.stringify(current.timer)) {
      updates.timer = mergedTimer;
      needsUpdate = true;
    }
  }

  if (needsUpdate) {
    await setStorageData(updates);
  }

  return await getStorageData(null);
}

/**
 * Get Focus Mode State
 * @returns {Promise<boolean>}
 */
async function getFocusMode() {
  const data = await getStorageData('focusMode');
  return typeof data.focusMode === 'boolean' ? data.focusMode : _DEFAULTS.focusMode;
}

/**
 * Set Focus Mode State
 * @param {boolean} enabled
 * @returns {Promise<boolean>}
 */
async function setFocusMode(enabled) {
  const boolVal = Boolean(enabled);
  return await setStorageData({ focusMode: boolVal });
}

/**
 * Get Settings
 * @returns {Promise<Object>}
 */
async function getSettings() {
  const data = await getStorageData('settings');
  return { ..._DEFAULTS.settings, ...(data.settings || {}) };
}

/**
 * Save Settings
 * @param {Object} newSettings
 * @returns {Promise<boolean>}
 */
async function saveSettings(newSettings) {
  const current = await getSettings();
  const merged = { ...current, ...(newSettings || {}) };
  return await setStorageData({ settings: merged });
}

/**
 * Get Channel Whitelist
 * @returns {Promise<Array<{ id: string, name: string, identifier: string, handle?: string, addedAt?: number }>>}
 */
async function getWhitelist() {
  const data = await getStorageData('whitelist');
  return Array.isArray(data.whitelist) ? data.whitelist : _DEFAULTS.whitelist;
}

/**
 * Save Whitelist
 * @param {Array} whitelist
 * @returns {Promise<boolean>}
 */
async function saveWhitelist(whitelist) {
  const validList = Array.isArray(whitelist) ? whitelist : [];
  return await setStorageData({ whitelist: validList });
}

/**
 * Add a Channel to Whitelist
 * @param {{ name: string, identifier: string, handle?: string }} channel
 * @returns {Promise<{ success: boolean, whitelist: Array, error?: string }>}
 */
async function addWhitelistChannel(channel) {
  if (!channel || !channel.name || !channel.identifier) {
    return { success: false, error: 'Channel name and identifier are required.' };
  }

  const list = await getWhitelist();
  const normalizedId = channel.identifier.toLowerCase().trim();

  // Check duplicate
  const exists = list.some(item =>
    item.identifier.toLowerCase().trim() === normalizedId ||
    (channel.handle && item.handle && item.handle.toLowerCase().trim() === channel.handle.toLowerCase().trim())
  );

  if (exists) {
    return { success: false, error: 'Channel is already in your whitelist.', whitelist: list };
  }

  const newItem = {
    id: 'ch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: channel.name.trim(),
    identifier: normalizedId,
    handle: channel.handle ? channel.handle.trim() : (normalizedId.startsWith('@') ? normalizedId : ''),
    addedAt: Date.now()
  };

  const updated = [newItem, ...list];
  await saveWhitelist(updated);
  return { success: true, channel: newItem, whitelist: updated };
}

/**
 * Remove a Channel from Whitelist
 * @param {string} idOrIdentifier
 * @returns {Promise<{ success: boolean, whitelist: Array }>}
 */
async function removeWhitelistChannel(idOrIdentifier) {
  if (!idOrIdentifier) return { success: false, whitelist: await getWhitelist() };

  const list = await getWhitelist();
  const target = String(idOrIdentifier).toLowerCase().trim();

  const filtered = list.filter(item =>
    item.id !== idOrIdentifier &&
    item.identifier.toLowerCase().trim() !== target &&
    (item.handle ? item.handle.toLowerCase().trim() !== target : true)
  );

  await saveWhitelist(filtered);
  return { success: true, whitelist: filtered };
}

/**
 * Check if a channel is whitelisted
 * @param {{ name?: string, identifier?: string, handle?: string }} channelInfo
 * @returns {Promise<boolean>}
 */
async function isChannelWhitelisted(channelInfo) {
  if (!channelInfo) return false;
  const list = await getWhitelist();

  const targetName = (channelInfo.name || '').toLowerCase().trim();
  const targetId = (channelInfo.identifier || '').toLowerCase().trim();
  const targetHandle = (channelInfo.handle || '').toLowerCase().trim();

  return list.some(item => {
    const itemName = item.name.toLowerCase().trim();
    const itemId = item.identifier.toLowerCase().trim();
    const itemHandle = (item.handle || '').toLowerCase().trim();

    if (targetHandle && itemHandle && (targetHandle === itemHandle || targetHandle === itemId)) return true;
    if (targetId && (itemId === targetId || itemHandle === targetId)) return true;
    if (targetName && (itemName === targetName || itemId === targetName)) return true;
    return false;
  });
}

/**
 * Get Timer State with live remaining calculation
 * @returns {Promise<Object>}
 */
async function getTimerState() {
  const data = await getStorageData('timer');
  const timer = { ..._DEFAULTS.timer, ...(data.timer || {}) };

  if (timer.running && timer.endTime) {
    const remainingMs = timer.endTime - Date.now();
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
    timer.remaining = remainingSec;

    if (remainingSec <= 0) {
      timer.running = false;
      timer.remaining = 0;
      timer.endTime = null;
      // Persist state change
      await setStorageData({ timer });
    }
  }

  return timer;
}

/**
 * Save Timer State
 * @param {Object} timerState
 * @returns {Promise<boolean>}
 */
async function saveTimerState(timerState) {
  const current = await getTimerState();
  const merged = { ...current, ...(timerState || {}) };
  return await setStorageData({ timer: merged });
}

// Assign to globalThis for content scripts, popups, and service worker
if (typeof globalThis !== 'undefined') {
  globalThis.getStorageData = getStorageData;
  globalThis.setStorageData = setStorageData;
  globalThis.initStorageDefaults = initStorageDefaults;
  globalThis.getFocusMode = getFocusMode;
  globalThis.setFocusMode = setFocusMode;
  globalThis.getSettings = getSettings;
  globalThis.saveSettings = saveSettings;
  globalThis.getWhitelist = getWhitelist;
  globalThis.saveWhitelist = saveWhitelist;
  globalThis.addWhitelistChannel = addWhitelistChannel;
  globalThis.removeWhitelistChannel = removeWhitelistChannel;
  globalThis.isChannelWhitelisted = isChannelWhitelisted;
  globalThis.getTimerState = getTimerState;
  globalThis.saveTimerState = saveTimerState;
}

// Module export for node/tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getStorageData,
    setStorageData,
    initStorageDefaults,
    getFocusMode,
    setFocusMode,
    getSettings,
    saveSettings,
    getWhitelist,
    saveWhitelist,
    addWhitelistChannel,
    removeWhitelistChannel,
    isChannelWhitelisted,
    getTimerState,
    saveTimerState
  };
}
