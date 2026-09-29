/**
 * BingeBlocker - Application Constants
 * Centralized message types, YouTube DOM selectors, and default configurations.
 */

// Message Actions between Popup, Background, and Content Scripts
const MESSAGE_TYPES = {
  // Focus Mode
  GET_FOCUS_MODE: 'BINGEBLOCKER_GET_FOCUS_MODE',
  TOGGLE_FOCUS_MODE: 'BINGEBLOCKER_TOGGLE_FOCUS_MODE',
  FOCUS_MODE_CHANGED: 'BINGEBLOCKER_FOCUS_MODE_CHANGED',

  // Session Timer
  GET_TIMER: 'BINGEBLOCKER_GET_TIMER',
  START_TIMER: 'BINGEBLOCKER_START_TIMER',
  PAUSE_TIMER: 'BINGEBLOCKER_PAUSE_TIMER',
  RESET_TIMER: 'BINGEBLOCKER_RESET_TIMER',
  SET_TIMER_DURATION: 'BINGEBLOCKER_SET_TIMER_DURATION',
  TIMER_UPDATED: 'BINGEBLOCKER_TIMER_UPDATED',
  TIMER_FINISHED: 'BINGEBLOCKER_TIMER_FINISHED',

  // Channel Whitelist
  GET_WHITELIST: 'BINGEBLOCKER_GET_WHITELIST',
  ADD_WHITELIST: 'BINGEBLOCKER_ADD_WHITELIST',
  REMOVE_WHITELIST: 'BINGEBLOCKER_REMOVE_WHITELIST',
  CHECK_WHITELIST: 'BINGEBLOCKER_CHECK_WHITELIST',
  WHITELIST_CHANGED: 'BINGEBLOCKER_WHITELIST_CHANGED',

  // Settings
  GET_SETTINGS: 'BINGEBLOCKER_GET_SETTINGS',
  UPDATE_SETTINGS: 'BINGEBLOCKER_UPDATE_SETTINGS',
  SETTINGS_CHANGED: 'BINGEBLOCKER_SETTINGS_CHANGED',

  // Page Context
  QUERY_PAGE_STATUS: 'BINGEBLOCKER_QUERY_PAGE_STATUS',
  PAGE_STATUS_RESPONSE: 'BINGEBLOCKER_PAGE_STATUS_RESPONSE'
};

// Storage Keys
const STORAGE_KEYS = {
  FOCUS_MODE: 'focusMode',
  WHITELIST: 'whitelist',
  SETTINGS: 'settings',
  TIMER: 'timer'
};

// Default Configuration State
const DEFAULT_STORAGE = {
  focusMode: true, // Enabled by default so users immediately experience distraction-free learning
  whitelist: [
    {
      id: 'mit-ocw',
      name: 'MIT OpenCourseWare',
      identifier: '@mitocw',
      addedAt: 1700000000000
    },
    {
      id: '3blue1brown',
      name: '3Blue1Brown',
      identifier: '@3blue1brown',
      addedAt: 1700000000000
    },
    {
      id: 'freecodecamp',
      name: 'freeCodeCamp.org',
      identifier: '@freecodecamp',
      addedAt: 1700000000000
    },
    {
      id: 'khanacademy',
      name: 'Khan Academy',
      identifier: '@khanacademy',
      addedAt: 1700000000000
    }
  ],
  settings: {
    hideShorts: true,
    hideComments: true,
    hideRecommendations: true,
    hideHomeFeed: true,
    hideEndScreen: true,
    defaultTimerDuration: 1500 // 25 minutes in seconds
  },
  timer: {
    duration: 1500,
    remaining: 1500,
    running: false,
    endTime: null
  }
};

// Centralized YouTube Selectors
const YT_SELECTORS = {
  app: 'ytd-app',
  pageManager: 'ytd-page-manager',
  watchFlexy: 'ytd-watch-flexy',
  browse: 'ytd-browse',
  homePageContents: 'ytd-browse[page-subtype="home"] #contents, ytd-browse[page-subtype="home"] ytd-rich-grid-renderer, ytd-browse[page-subtype="home"] #primary',
  shortsNavButtons: 'ytd-guide-entry-renderer a[title="Shorts"], ytd-mini-guide-entry-renderer[aria-label="Shorts"], a[title="Shorts"], a[href^="/shorts"]',
  shortsShelves: 'ytd-reel-shelf-renderer, ytd-rich-section-renderer:has(ytd-reel-shelf-renderer), ytd-rich-shelf-renderer[is-shorts]',
  relatedVideos: '#secondary #related, ytd-watch-next-secondary-results-renderer, #related',
  comments: 'ytd-comments#comments, #comments, ytd-item-section-renderer[section-identifier="comment-item-section"]',
  endScreen: '.ytp-ce-element, .ytp-endscreen-content, .ytp-ce-covering-overlay'
};

// Attach to global scope for seamless access in content scripts & service workers
if (typeof globalThis !== 'undefined') {
  globalThis.MESSAGE_TYPES = MESSAGE_TYPES;
  globalThis.STORAGE_KEYS = STORAGE_KEYS;
  globalThis.DEFAULT_STORAGE = DEFAULT_STORAGE;
  globalThis.YT_SELECTORS = YT_SELECTORS;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MESSAGE_TYPES,
    STORAGE_KEYS,
    DEFAULT_STORAGE,
    YT_SELECTORS
  };
}
