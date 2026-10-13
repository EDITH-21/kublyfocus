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
      // Migrate legacy whitelist items safely without dropping user data
      const migrated = [];
      for (const item of current.whitelist) {
        const norm = (typeof globalThis.normalizeChannelInfo === 'function')
          ? globalThis.normalizeChannelInfo(item)
          : (typeof globalThis.resolveChannelIdentity === 'function' ? globalThis.resolveChannelIdentity(item) : item);

        const classified = (typeof globalThis.classifyChannel === 'function')
          ? globalThis.classifyChannel(norm)
          : { eligible: true, category: 'education', confidence: 85, reasons: [] };

        migrated.push({
          id: item.id || ('ch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
          channelId: norm.channelId || item.channelId || '',
          name: norm.name || item.name || item.identifier,
          handle: norm.handle || item.handle || (item.identifier && item.identifier.startsWith('@') ? item.identifier : ''),
          normalizedHandle: norm.normalizedHandle || (item.handle || item.identifier || '').replace(/^@/, '').toLowerCase(),
          avatarUrl: norm.avatarUrl || item.avatarUrl || '',
          identifier: norm.identifier || item.identifier || (norm.handle ? norm.handle.toLowerCase() : ''),
          category: item.category || classified.category || 'education',
          confidence: item.confidence || classified.confidence || 90,
          reasons: item.reasons || classified.reasons || ['Migrated learning channel'],
          source: item.source || (classified.verified ? 'system_verified' : 'user_approved'),
          addedAt: item.addedAt || Date.now()
        });
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
/**
 * Add a Channel to Learning Channels Allowlist
 * Canonical channel identity (Channel ID UC... primary, normalized handle secondary).
 * Explicit user allowlisting takes strict precedence.
 * @param {Object|string} channelInput
 * @param {Object} [options] - { force, explicit }
 * @returns {Promise<{ success: boolean, channel?: Object, learningChannels?: Array, error?: string, reasons?: string[] }>}
 */
async function addLearningChannel(channelInput, options = {}) {
  if (!channelInput) {
    return { success: false, error: 'Channel details are required.' };
  }

  // 1. Resolve Canonical Identity
  const identity = (typeof globalThis.normalizeChannelInfo === 'function')
    ? globalThis.normalizeChannelInfo(channelInput)
    : ((typeof globalThis.resolveChannelIdentity === 'function')
      ? globalThis.resolveChannelIdentity(channelInput)
      : { name: channelInput.name || '', handle: channelInput.handle || '', normalizedHandle: '', channelId: channelInput.channelId || '', avatarUrl: '' });

  if (!identity.name && !identity.handle && !identity.channelId) {
    return { success: false, error: 'Please enter a valid channel name, @handle, or YouTube URL.' };
  }

  const list = await getLearningChannels();

  // 2. Check if already allowlisted using canonical matching
  const existing = list.find(item => {
    if (typeof globalThis.matchesChannelIdentity === 'function') {
      return globalThis.matchesChannelIdentity(identity, item);
    }
    const itemHandle = (item.normalizedHandle || (item.handle || '')).replace(/^@/, '').toLowerCase();
    const itemId = (item.channelId || item.identifier || '').toLowerCase();
    const itemName = (item.name || '').toLowerCase().trim();
    if (identity.channelId && itemId && identity.channelId.toLowerCase() === itemId) return true;
    if (identity.normalizedHandle && itemHandle && identity.normalizedHandle === itemHandle) return true;
    if (identity.name && itemName && identity.name.toLowerCase().trim() === itemName) return true;
    return false;
  });

  if (existing) {
    return { success: true, alreadyExists: true, channel: existing, learningChannels: list };
  }

  // 3. Classify Channel for metadata & insights
  const classification = (typeof globalThis.classifyChannel === 'function')
    ? globalThis.classifyChannel({ ...channelInput, ...identity })
    : { eligible: true, category: 'education', confidence: 90, reasons: [] };

  // Explicit user addition (from popup 1-click or block screen) always succeeds
  const isExplicit = options.force || options.explicit || (channelInput && channelInput.explicit !== false);

  if (!classification.eligible && !isExplicit && classification.category === 'entertainment') {
    return {
      success: false,
      error: `Cannot add "${identity.name || identity.handle}": Channel appears to be entertainment-focused.`,
      category: classification.category,
      reasons: classification.reasons,
      confidence: classification.confidence
    };
  }

  const newItem = {
    id: 'ch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    channelId: identity.channelId || '',
    name: identity.name || (identity.handle ? identity.handle.slice(1) : 'Learning Channel'),
    handle: identity.handle || (identity.normalizedHandle ? `@${identity.normalizedHandle}` : ''),
    normalizedHandle: identity.normalizedHandle || (identity.handle || '').replace(/^@/, '').toLowerCase(),
    avatarUrl: identity.avatarUrl || channelInput.avatarUrl || '',
    identifier: identity.channelId || identity.handle || (identity.normalizedHandle ? `@${identity.normalizedHandle}` : (identity.name || '').toLowerCase().replace(/\s+/g, '')),
    category: classification.category || 'education',
    confidence: classification.confidence || (isExplicit ? 95 : 90),
    reasons: classification.reasons && classification.reasons.length > 0 ? classification.reasons : ['User approved learning channel'],
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
async function addWhitelistChannel(channel, options) {
  return await addLearningChannel(channel, options);
}

/**
 * Remove a Channel from Learning Channels
 * Matches by ID, channelId (UC...), handle, or name
 * @param {string|Object} idOrIdentifier
 * @returns {Promise<{ success: boolean, learningChannels: Array }>}
 */
async function removeLearningChannel(idOrIdentifier) {
  if (!idOrIdentifier) return { success: false, learningChannels: await getLearningChannels() };

  const list = await getLearningChannels();
  const target = (typeof idOrIdentifier === 'object') ? idOrIdentifier : String(idOrIdentifier).trim();

  const filtered = list.filter(item => {
    if (typeof globalThis.matchesChannelIdentity === 'function') {
      if (globalThis.matchesChannelIdentity(item, target)) return false;
    }
    const targetStr = (typeof target === 'string') ? target.toLowerCase().replace(/^@/, '') : '';
    const itemId = String(item.id || '').toLowerCase();
    const itemChId = String(item.channelId || '').toLowerCase();
    const itemHandle = String(item.handle || '').toLowerCase().replace(/^@/, '');
    const itemNorm = String(item.normalizedHandle || '').toLowerCase();
    const itemName = String(item.name || '').toLowerCase();

    if (targetStr && (itemId === targetStr || itemChId === targetStr || itemHandle === targetStr || itemNorm === targetStr || itemName === targetStr)) {
      return false;
    }
    return true;
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
 * Follows strict evaluation order with canonical identity precedence:
 * 1. System-verified channels
 * 2. User-approved channels (canonical Channel ID or handle match)
 * If allowlisted, do not block the video solely because content-classification rules consider it distracting!
 * @param {Object|string} channelInfo
 * @returns {Promise<boolean>}
 */
async function isChannelLearningApproved(channelInfo) {
  if (!channelInfo) return false;

  const identity = (typeof globalThis.normalizeChannelInfo === 'function')
    ? globalThis.normalizeChannelInfo(channelInfo)
    : ((typeof globalThis.resolveChannelIdentity === 'function')
      ? globalThis.resolveChannelIdentity(channelInfo)
      : { name: channelInfo.name || '', handle: channelInfo.handle || '', normalizedHandle: '', channelId: channelInfo.channelId || '' });

  if (!identity.name && !identity.handle && !identity.channelId) {
    return false;
  }

  // 1. Check System Verified Learning Channels Registry
  if (typeof globalThis.isSystemVerifiedLearningChannel === 'function') {
    const verified = globalThis.isSystemVerifiedLearningChannel(identity);
    if (verified) return true;
  }

  // 2. Check User-Approved Stored Learning Channels (Allowlist Precedence)
  const list = await getLearningChannels();
  if (Array.isArray(list) && list.length > 0) {
    const matched = list.some(item => {
      if (typeof globalThis.matchesChannelIdentity === 'function') {
        return globalThis.matchesChannelIdentity(identity, item);
      }
      const itemHandle = (item.normalizedHandle || (item.handle || item.identifier || '')).replace(/^@/, '').toLowerCase().trim();
      const itemId = (item.channelId || item.identifier || '').toLowerCase().trim();
      const itemName = (item.name || '').toLowerCase().trim();
      const targetHandle = (identity.normalizedHandle || (identity.handle || '')).replace(/^@/, '').toLowerCase().trim();
      const targetId = (identity.channelId || '').toLowerCase().trim();
      const targetName = (identity.name || '').toLowerCase().trim();

      if (targetId && itemId && targetId === itemId) return true;
      if (targetHandle && itemHandle && targetHandle === itemHandle) return true;
      if (targetName && itemName && targetName === itemName) return true;
      return false;
    });

    // If channel is explicitly allowlisted by user, honor it immediately!
    if (matched) {
      return true;
    }
  }

  return false;
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
