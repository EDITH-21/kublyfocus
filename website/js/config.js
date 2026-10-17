/**
 * Knolect Official Website Configuration
 * Central single source of truth for product URLs, store links, video tutorial, and browser detection.
 */

/**
 * =========================================================================
 * 1. CHROME WEB STORE CONFIGURATION
 * =========================================================================
 * When your extension is approved and live on the Chrome Web Store:
 * Paste the full listing URL here (e.g. "https://chromewebstore.google.com/detail/knolect/abcdefghijklmnopqrstuvwxyz123456").
 *
 * When this is empty (""):
 * The website presents a publication-ready pre-launch state with early access
 * notification and transparent developer testing options.
 */
const CHROME_STORE_URL = "";

const BROWSER_STORE_URLS = {
  chrome: CHROME_STORE_URL,
  edge: CHROME_STORE_URL,
  brave: CHROME_STORE_URL,
  opera: CHROME_STORE_URL,
  chromium: CHROME_STORE_URL
};

/**
 * =========================================================================
 * 2. TUTORIAL VIDEO CONFIGURATION
 * =========================================================================
 * Provide EITHER a YouTube Video ID OR a hosted MP4 video URL:
 * - youtubeVideoId: e.g. "dQw4w9WgXcQ" (the 11-char ID from https://youtu.be/ID or watch?v=ID)
 * - hostedVideoUrl: e.g. "/assets/videos/knolect-tutorial.mp4"
 *
 * When both are empty (""):
 * The website displays a polished, publication-ready video placeholder with
 * clear developer instructions on how to connect the live asset.
 */
const TUTORIAL_VIDEO = {
  youtubeVideoId: "", // Add YouTube video ID here when ready
  hostedVideoUrl: "", // Or relative/absolute URL to an MP4 video file
  title: "See Knolect in Action — Turn YouTube into Your Focused Learning Space",
  durationText: "3 min quickstart",
  posterImage: "assets/tutorial-poster.svg"
};

// Product Metadata
const PRODUCT_INFO = {
  name: "Knolect",
  version: "1.0.0",
  tagline: "Turn YouTube into your learning space.",
  shortDesc: "Learn what you came for. Block what pulls you away.",
  manifestVersion: 3
};

/**
 * Detect the user's browser and environment
 * @returns {{ name: string, isChromium: boolean, isSupported: boolean, isMobile: boolean, label: string, reason?: string }}
 */
function detectBrowser() {
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  
  let name = 'chrome';
  let label = 'Google Chrome';
  let isChromium = true;
  let isSupported = !isMobile;
  let reason = '';

  if (isMobile) {
    name = 'mobile';
    label = 'Mobile Browser';
    isChromium = false;
    isSupported = false;
    reason = 'Extensions are designed for desktop browsers. Open on a computer to install Knolect.';
  } else if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    name = 'brave';
    label = 'Brave';
    isChromium = true;
    isSupported = true;
  } else if (/Edg\//.test(ua)) {
    name = 'edge';
    label = 'Microsoft Edge';
    isChromium = true;
    isSupported = true;
  } else if (/OPR\/|Opera\//.test(ua)) {
    name = 'opera';
    label = 'Opera';
    isChromium = true;
    isSupported = true;
  } else if (/Vivaldi\//.test(ua)) {
    name = 'vivaldi';
    label = 'Vivaldi';
    isChromium = true;
    isSupported = true;
  } else if (/Chrome\//.test(ua)) {
    name = 'chrome';
    label = 'Google Chrome';
    isChromium = true;
    isSupported = true;
  } else if (/Firefox\//.test(ua)) {
    name = 'firefox';
    label = 'Firefox';
    isChromium = false;
    isSupported = false;
    reason = 'Knolect is currently engineered for Chromium browsers (Chrome, Edge, Brave, Opera). A Firefox edition is in development.';
  } else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
    name = 'safari';
    label = 'Safari';
    isChromium = false;
    isSupported = false;
    reason = 'Knolect requires a desktop Chromium browser (Chrome, Edge, Brave, Opera). Safari extension support is planned.';
  }

  return { name, label, isChromium, isSupported, isMobile, reason };
}

/**
 * Get the target installation destination for a button
 * @param {string} [specificBrowser]
 * @returns {{ url: string, isDirectStore: boolean, label: string, isLive: boolean }}
 */
function getInstallTarget(specificBrowser = null) {
  const browser = specificBrowser ? { name: specificBrowser, label: specificBrowser.charAt(0).toUpperCase() + specificBrowser.slice(1) } : detectBrowser();
  const storeUrl = BROWSER_STORE_URLS[browser.name] || CHROME_STORE_URL;

  if (storeUrl && storeUrl.trim() !== "") {
    return {
      url: storeUrl,
      isDirectStore: true,
      isLive: true,
      label: `Add to ${browser.label || 'Chrome'}`
    };
  }

  return {
    url: "/install#installation",
    isDirectStore: false,
    isLive: false,
    label: "Get Early Access"
  };
}

// Global scope export
if (typeof window !== 'undefined') {
  window.CHROME_STORE_URL = CHROME_STORE_URL;
  window.BROWSER_STORE_URLS = BROWSER_STORE_URLS;
  window.TUTORIAL_VIDEO = TUTORIAL_VIDEO;
  window.PRODUCT_INFO = PRODUCT_INFO;
  window.detectBrowser = detectBrowser;
  window.getInstallTarget = getInstallTarget;
}
