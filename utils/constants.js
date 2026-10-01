/**
 * Knolect - Application Constants
 * Centralized message types, YouTube DOM selectors, and default configurations.
 *
 * Tagline: "Turn YouTube into a focused learning environment."
 */

// Message Actions between Popup, Background, and Content Scripts
const MESSAGE_TYPES = {
  // Focus Mode
  GET_FOCUS_MODE: 'KNOLECT_GET_FOCUS_MODE',
  TOGGLE_FOCUS_MODE: 'KNOLECT_TOGGLE_FOCUS_MODE',
  FOCUS_MODE_CHANGED: 'KNOLECT_FOCUS_MODE_CHANGED',

  // Strict Focus Mode
  GET_STRICT_FOCUS: 'KNOLECT_GET_STRICT_FOCUS',
  TOGGLE_STRICT_FOCUS: 'KNOLECT_TOGGLE_STRICT_FOCUS',
  STRICT_FOCUS_CHANGED: 'KNOLECT_STRICT_FOCUS_CHANGED',

  // Session Timer
  GET_TIMER: 'KNOLECT_GET_TIMER',
  START_TIMER: 'KNOLECT_START_TIMER',
  PAUSE_TIMER: 'KNOLECT_PAUSE_TIMER',
  RESET_TIMER: 'KNOLECT_RESET_TIMER',
  SET_TIMER_DURATION: 'KNOLECT_SET_TIMER_DURATION',
  TIMER_UPDATED: 'KNOLECT_TIMER_UPDATED',
  TIMER_FINISHED: 'KNOLECT_TIMER_FINISHED',

  // Channel Whitelist
  GET_WHITELIST: 'KNOLECT_GET_WHITELIST',
  ADD_WHITELIST: 'KNOLECT_ADD_WHITELIST',
  REMOVE_WHITELIST: 'KNOLECT_REMOVE_WHITELIST',
  CHECK_WHITELIST: 'KNOLECT_CHECK_WHITELIST',
  WHITELIST_CHANGED: 'KNOLECT_WHITELIST_CHANGED',

  // Settings
  GET_SETTINGS: 'KNOLECT_GET_SETTINGS',
  UPDATE_SETTINGS: 'KNOLECT_UPDATE_SETTINGS',
  SETTINGS_CHANGED: 'KNOLECT_SETTINGS_CHANGED',

  // Page Context & Enforcement
  QUERY_PAGE_STATUS: 'KNOLECT_QUERY_PAGE_STATUS',
  PAGE_STATUS_RESPONSE: 'KNOLECT_PAGE_STATUS_RESPONSE',
  FORCE_REAPPLY: 'KNOLECT_FORCE_REAPPLY',

  // Analytics (Privacy-Safe)
  LOG_ANALYTICS_EVENT: 'KNOLECT_LOG_ANALYTICS_EVENT'
};

// Storage Keys
const STORAGE_KEYS = {
  FOCUS_MODE: 'focusMode',
  STRICT_FOCUS: 'strictFocus',
  WHITELIST: 'whitelist',
  SETTINGS: 'settings',
  TIMER: 'timer',
  ONBOARDING: 'onboardingCompleted'
};

// Default Configuration State
const DEFAULT_STORAGE = {
  focusMode: true, // Enabled by default for immediate learning environment
  strictFocus: true, // Strict Focus enabled by default: Allowlist-first access control
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
    blockSearch: true, // In Strict Focus, blocks non-educational search distraction
    defaultTimerDuration: 1500 // 25 minutes in seconds
  },
  timer: {
    duration: 1500,
    remaining: 1500,
    running: false,
    endTime: null
  },
  onboardingCompleted: true
};

// Centralized YouTube Selectors
const YT_SELECTORS = {
  app: 'ytd-app',
  pageManager: 'ytd-page-manager',
  watchFlexy: 'ytd-watch-flexy',
  browse: 'ytd-browse',
  player: '#movie_player, .html5-video-player',
  videoElement: 'video.html5-main-video',

  // Home page feed
  homePageContents: 'ytd-browse[page-subtype="home"] #contents, ytd-browse[page-subtype="home"] ytd-rich-grid-renderer, ytd-browse[page-subtype="home"] #primary, ytd-two-column-browse-results-renderer[page-subtype="home"]',

  // Search Results
  searchResults: 'ytd-search, ytd-search #contents, ytd-two-column-search-results-renderer',

  // Shorts
  shortsNavButtons: 'ytd-guide-entry-renderer a[title="Shorts"], ytd-mini-guide-entry-renderer[aria-label="Shorts"], a[title="Shorts"], a[href^="/shorts"]',
  shortsShelves: 'ytd-reel-shelf-renderer, ytd-rich-section-renderer:has(ytd-reel-shelf-renderer), ytd-rich-shelf-renderer[is-shorts]',
  shortsPlayer: 'ytd-shorts, ytm-shorts, #shorts-container',

  // Watch page elements
  relatedVideos: '#secondary #related, #secondary-inner #related, ytd-watch-next-secondary-results-renderer, #related',
  comments: 'ytd-comments#comments, #comments, ytd-item-section-renderer[section-identifier="comment-item-section"]',
  endScreen: '.ytp-ce-element, .ytp-endscreen-content, .ytp-ce-covering-overlay',

  // Channel details on watch & channel pages
  channelNameWatch: '#owner #channel-name a, ytd-video-owner-renderer #channel-name a, #upload-info #channel-name a, ytd-channel-name a',
  channelHandleWatch: '#owner #channel-name a[href^="/@"], #owner ytd-channel-name a, #upload-info a[href^="/@"]',
  channelPageHeader: 'ytd-channel-name#channel-header-name, ytd-c4-tabbed-header-renderer #channel-name, #channel-header yt-formatted-string'
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
