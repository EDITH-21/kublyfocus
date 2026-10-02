/**
 * Knolect - Storage Layer
 * Centralized async wrapper around chrome.storage.local with defaults,
 * schema migrations, and strict learning-channel verification.
 */

const _DEFAULTS = (typeof globalThis.DEFAULT_STORAGE !== 'undefined') ? globalThis.DEFAULT_STORAGE : {
  focusMode: true,
  strictFocus: true,
  learningChannels: (typeof globalThis.INITIAL_LEARNING_CHANNELS !== 'undefined') ? globalThis.INITIAL_LEARNING_CHANNELS : [],
  whitelist: (typeof globalThis.INITIAL_LEARNING_CHANNELS !== 'undefined') ? globalThis.INITIAL_LEARNING_CHANNELS : [],
  settings: {
    hideShorts: true,
    hideComments: true,
    hideRecommendations: true,
    hideHomeFeed: true,
    hideEndScreen: true,
    blockSearch: true,
    defaultTimerDuration: 1500
  },
  timer: {
    duration: 1500,
    remaining: 1500,
    running: false,
    endTime: null
  },
  onboardingCompleted: true
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
          if (chrome.runtime && chrome.runtime.lastError) {
            console.error('[Knolect Storage] Error reading storage:', chrome.runtime.lastError);
            resolve({});
          } else {
            resolve(result || {});
          }
        });
      } else {
        resolve({});
      }
    } catch (err) {
      console.error('[Knolect Storage] Exception in getStorageData:', err);
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
          if (chrome.runtime && chrome.runtime.lastError) {
            console.error('[Knolect Storage] Error writing storage:', chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      } else {
        resolve(false);
      }
    } catch (err) {
      console.error('[Knolect Storage] Exception in setStorageData:', err);
      resolve(false);
    }
  });
}

/**
 * Initialize default storage data & run migrations if needed
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
  if (typeof current.strictFocus === 'undefined') {
    updates.strictFocus = _DEFAULTS.strictFocus;
    needsUpdate = true;
  }

  // Check learningChannels or run migration from legacy whitelist
  if (!Array.isArray(current.learningChannels)) {
    if (Array.isArray(current.whitelist) && current.whitelist.length > 0) {
      // Migrate legacy whitelist items safely
      const migrated = [];
      for (const item of current.whitelist) {
        const classified = (typeof globalThis.classifyChannel === 'function')
          ? globalThis.classifyChannel(item)
          : { eligible: true, category: 'education', confidence: 80, reasons: [] };

        if (classified.eligible) {
          migrated.push({
            id: item.id || ('ch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
            channelId: item.channelId || '',
            name: item.name || item.identifier,
            handle: item.handle || (item.identifier && item.identifier.startsWith('@') ? item.identifier : ''),
            normalizedHandle: (item.handle || item.identifier || '').replace(/^@/, '').toLowerCase(),
            identifier: item.identifier || (item.handle ? item.handle.toLowerCase() : ''),
            category: classified.category || 'education',
            confidence: classified.confidence || 85,
            reasons: classified.reasons || ['Migrated learning channel'],
            source: 'migrated_verified',
            addedAt: item.addedAt || Date.now()
          });
        }
      }
      updates.learningChannels = migrated.length > 0 ? migrated : _DEFAULTS.learningChannels;
      updates.whitelist = updates.learningChannels;
      needsUpdate = true;
    } else {
      updates.learningChannels = _DEFAULTS.learningChannels;
      updates.whitelist = _DEFAULTS.learningChannels;
      needsUpdate = true;
    }
  }

  if (!current.settings) {
    updates.settings = _DEFAULTS.settings;
    needsUpdate = true;
  }
  if (!current.timer) {
    updates.timer = _DEFAULTS.timer;
    needsUpdate = true;
  }
  if (typeof current.onboardingCompleted === 'undefined') {
    updates.onboardingCompleted = true;
    needsUpdate = true;
  }

  if (needsUpdate) {
    await setStorageData(updates);
    return { ...current, ...updates };
  }

  return current;
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
  return await setStorageData({ focusMode: Boolean(enabled) });
}

/**
 * Get Strict Focus State
 * @returns {Promise<boolean>}
 */
async function getStrictFocus() {
  const data = await getStorageData('strictFocus');
  return typeof data.strictFocus === 'boolean' ? data.strictFocus : _DEFAULTS.strictFocus;
}

/**
 * Set Strict Focus State
 * @param {boolean} enabled
 * @returns {Promise<boolean>}
 */
async function setStrictFocus(enabled) {
  return await setStorageData({ strictFocus: Boolean(enabled) });
}

/**
 * Get Timer State
 * @returns {Promise<Object>}
 */
async function getTimerState() {
  const data = await getStorageData('timer');
  const timer = data.timer || _DEFAULTS.timer;

  if (timer.running && timer.endTime) {
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((timer.endTime - now) / 1000));
    return {
      ...timer,
      remaining,
      running: remaining > 0
    };
  }

  return timer;
}

/**
 * Save Timer State
 * @param {Object} timerState
 * @returns {Promise<boolean>}
 */
async function saveTimerState(timerState) {
  return await setStorageData({ timer: timerState });
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
 * Get Approved Learning Channels
 * @returns {Promise<Array<Object>>}
 */
async function getLearningChannels() {
  const data = await getStorageData(['learningChannels', 'whitelist']);
  if (Array.isArray(data.learningChannels) && data.learningChannels.length > 0) {
    return data.learningChannels;
  }
  if (Array.isArray(data.whitelist) && data.whitelist.length > 0) {
    return data.whitelist;
  }
  return _DEFAULTS.learningChannels;
}

/**
 * Legacy alias for getLearningChannels
 */
async function getWhitelist() {
  return await getLearningChannels();
}

/**
 * Save Learning Channels
 * @param {Array} channels
 * @returns {Promise<boolean>}
 */
async function saveLearningChannels(channels) {
  const validList = Array.isArray(channels) ? channels : [];
  return await setStorageData({
    learningChannels: validList,
    whitelist: validList // Mirror to legacy whitelist key
  });
}

/**
 * Legacy alias for saveLearningChannels
 */
async function saveWhitelist(whitelist) {
  return await saveLearningChannels(whitelist);
}

/**
 * Add a Channel to Learning Channels Allowlist
 * Runs deterministic classification and refuses arbitrary entertainment channels.
 * @param {Object|string} channelInput
 * @returns {Promise<{ success: boolean, channel?: Object, learningChannels?: Array, error?: string, reasons?: string[] }>}
 */
async function addLearningChannel(channelInput) {
  if (!channelInput) {
    return { success: false, error: 'Channel details are required.' };
  }

  // 1. Resolve Identity
  const identity = (typeof globalThis.resolveChannelIdentity === 'function')
    ? globalThis.resolveChannelIdentity(channelInput)
    : { name: channelInput.name || '', handle: channelInput.handle || '', normalizedHandle: '', channelId: channelInput.channelId || '' };

  if (!identity.name && !identity.handle && !identity.channelId) {
    return { success: false, error: 'Please enter a valid channel name, @handle, or YouTube URL.' };
  }

  // 2. Classify Channel
  const classification = (typeof globalThis.classifyChannel === 'function')
    ? globalThis.classifyChannel({ ...channelInput, ...identity })
    : { eligible: true, category: 'education', confidence: 90, reasons: [] };

  if (!classification.eligible) {
    return {
      success: false,
      error: `Cannot add "${identity.name || identity.handle}": Channel does not meet educational criteria for Strict Focus Mode.`,
      category: classification.category,
      reasons: classification.reasons,
      confidence: classification.confidence
    };
  }

  const list = await getLearningChannels();
  const normalizedHandle = identity.normalizedHandle || (identity.handle || '').replace(/^@/, '').toLowerCase();
  const normalizedId = (identity.channelId || '').toLowerCase();
  const normalizedName = (identity.name || '').toLowerCase().trim();

  // Check duplicate
  const exists = list.some(item => {
    const itemHandle = (item.normalizedHandle || (item.handle || '')).replace(/^@/, '').toLowerCase();
    const itemId = (item.channelId || item.identifier || '').toLowerCase();
    const itemName = (item.name || '').toLowerCase().trim();

    if (normalizedHandle && itemHandle && normalizedHandle === itemHandle) return true;
    if (normalizedId && itemId && normalizedId === itemId) return true;
    if (normalizedName && itemName && normalizedName === itemName) return true;
    return false;
  });

  if (exists) {
    return { success: false, error: 'This channel is already in your Learning Channels list.', learningChannels: list };
  }

  const newItem = {
    id: 'ch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    channelId: identity.channelId || '',
    name: identity.name || (identity.handle ? identity.handle.slice(1) : 'Learning Channel'),
    handle: identity.handle || (normalizedHandle ? `@${normalizedHandle}` : ''),
    normalizedHandle,
    identifier: identity.handle || identity.channelId || `@${normalizedHandle}`,
    category: classification.category || 'education',
    confidence: classification.confidence || 90,
    reasons: classification.reasons || ['Verified learning content'],
    source: classification.verified ? 'system_verified' : 'user_approved',
    addedAt: Date.now()
  };

  const updated = [newItem, ...list];
  await saveLearningChannels(updated);
  return { success: true, channel: newItem, learningChannels: updated, classification };
}

/**
 * Legacy alias for addLearningChannel
 */
async function addWhitelistChannel(channel) {
  return await addLearningChannel(channel);
}

/**
 * Remove a Channel from Learning Channels
 * @param {string} idOrIdentifier
 * @returns {Promise<{ success: boolean, learningChannels: Array }>}
 */
async function removeLearningChannel(idOrIdentifier) {
  if (!idOrIdentifier) return { success: false, learningChannels: await getLearningChannels() };

  const list = await getLearningChannels();
  const target = String(idOrIdentifier).toLowerCase().trim().replace(/^@/, '');

  const filtered = list.filter(item => {
    const itemId = String(item.id || '').toLowerCase().trim();
    const itemChId = String(item.channelId || '').toLowerCase().trim();
    const itemHandle = String(item.handle || item.identifier || '').toLowerCase().trim().replace(/^@/, '');
    const itemNorm = String(item.normalizedHandle || '').toLowerCase().trim();

    return itemId !== target && itemChId !== target && itemHandle !== target && itemNorm !== target;
  });

  await saveLearningChannels(filtered);
  return { success: true, learningChannels: filtered, whitelist: filtered };
}

/**
 * Legacy alias for removeLearningChannel
 */
async function removeWhitelistChannel(idOrIdentifier) {
  return await removeLearningChannel(idOrIdentifier);
}

/**
 * Check if a channel is approved for learning in Strict Focus Mode
 * Follows strict evaluation order:
 * 1. System-verified channels
 * 2. User-approved channels
 * 3. Eligibility validation
 * @param {Object|string} channelInfo
 * @returns {Promise<boolean>}
 */
async function isChannelLearningApproved(channelInfo) {
  if (!channelInfo) return false;

  const identity = (typeof globalThis.resolveChannelIdentity === 'function')
    ? globalThis.resolveChannelIdentity(channelInfo)
    : { name: channelInfo.name || '', handle: channelInfo.handle || '', normalizedHandle: '', channelId: channelInfo.channelId || '' };

  // 1. Check System Verified Learning Channels Registry
  if (typeof globalThis.isSystemVerifiedLearningChannel === 'function') {
    const verified = globalThis.isSystemVerifiedLearningChannel(identity);
    if (verified) return true;
  }

  // 2. Check User-Approved Stored Learning Channels
  const list = await getLearningChannels();
  const targetHandle = (identity.normalizedHandle || (identity.handle || '')).replace(/^@/, '').toLowerCase().trim();
  const targetId = (identity.channelId || '').toLowerCase().trim();
  const targetName = (identity.name || '').toLowerCase().trim();

  const matched = list.find(item => {
    const itemHandle = (item.normalizedHandle || (item.handle || item.identifier || '')).replace(/^@/, '').toLowerCase().trim();
    const itemId = (item.channelId || item.identifier || '').toLowerCase().trim();
    const itemName = (item.name || '').toLowerCase().trim();

    if (targetHandle && itemHandle && targetHandle === itemHandle) return true;
    if (targetId && itemId && targetId === itemId) return true;
    if (targetName && itemName && targetName === itemName) return true;
    return false;
  });

  if (!matched) return false;

  // 3. Validate that stored entry is still eligible
  if (typeof globalThis.isStillEligible === 'function') {
    return globalThis.isStillEligible(matched);
  }

  return matched.category === 'education' && matched.eligible !== false;
}

/**
 * Legacy alias for isChannelLearningApproved
 */
async function isChannelWhitelisted(channelInfo) {
  return await isChannelLearningApproved(channelInfo);
}

// Global scope attachment
if (typeof globalThis !== 'undefined') {
  globalThis.getStorageData = getStorageData;
  globalThis.setStorageData = setStorageData;
  globalThis.initStorageDefaults = initStorageDefaults;
  globalThis.getFocusMode = getFocusMode;
  globalThis.setFocusMode = setFocusMode;
  globalThis.getStrictFocus = getStrictFocus;
  globalThis.setStrictFocus = setStrictFocus;
  globalThis.getTimerState = getTimerState;
  globalThis.saveTimerState = saveTimerState;
  globalThis.getSettings = getSettings;
  globalThis.saveSettings = saveSettings;
  globalThis.getLearningChannels = getLearningChannels;
  globalThis.saveLearningChannels = saveLearningChannels;
  globalThis.addLearningChannel = addLearningChannel;
  globalThis.removeLearningChannel = removeLearningChannel;
  globalThis.isChannelLearningApproved = isChannelLearningApproved;

  // Legacy aliases
  globalThis.getWhitelist = getWhitelist;
  globalThis.saveWhitelist = saveWhitelist;
  globalThis.addWhitelistChannel = addWhitelistChannel;
  globalThis.removeWhitelistChannel = removeWhitelistChannel;
  globalThis.isChannelWhitelisted = isChannelWhitelisted;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getStorageData,
    setStorageData,
    initStorageDefaults,
    getFocusMode,
    setFocusMode,
    getStrictFocus,
    setStrictFocus,
    getTimerState,
    saveTimerState,
    getSettings,
    saveSettings,
    getLearningChannels,
    saveLearningChannels,
    addLearningChannel,
    removeLearningChannel,
    isChannelLearningApproved,
    getWhitelist,
    saveWhitelist,
    addWhitelistChannel,
    removeWhitelistChannel,
    isChannelWhitelisted
  };
}
