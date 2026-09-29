/**
 * BingeBlocker Official Website Configuration
 * Central single source of truth for product URLs, store links, and browser detection.
 */

// Central Chrome Web Store Configuration URL
// Set to official Chrome Web Store URL when published.
// When empty (""), the website directs users to the dedicated /install page.
const CHROME_STORE_URL = "";

// Supported browser links (can be updated with direct store URLs when available)
const BROWSER_STORE_URLS = {
  chrome: CHROME_STORE_URL,
  edge: CHROME_STORE_URL,
  brave: CHROME_STORE_URL,
  opera: CHROME_STORE_URL,
  chromium: CHROME_STORE_URL
};

// Product Metadata
const PRODUCT_INFO = {
  name: "BingeBlocker",
  version: "1.0.0",
  tagline: "Transforming YouTube into a Productive Learning Environment",
  shortDesc: "Watch what you came for. Skip everything else.",
  manifestVersion: 3
};

/**
 * Detect the user's browser
 * @returns {{ name: string, isChromium: boolean, label: string }}
 */
function detectBrowser() {
  const ua = navigator.userAgent;
  let name = 'chrome';
  let label = 'Google Chrome';
  let isChromium = true;

  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    name = 'brave';
    label = 'Brave';
  } else if (/Edg\//.test(ua)) {
    name = 'edge';
    label = 'Microsoft Edge';
  } else if (/OPR\/|Opera\//.test(ua)) {
    name = 'opera';
    label = 'Opera';
  } else if (/Chrome\//.test(ua)) {
    name = 'chrome';
    label = 'Google Chrome';
  } else if (/Firefox\//.test(ua)) {
    name = 'firefox';
    label = 'Firefox';
    isChromium = false;
  } else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
    name = 'safari';
    label = 'Safari';
    isChromium = false;
  }

  return { name, label, isChromium };
}

/**
 * Get the target installation destination for a button
 * @param {string} [specificBrowser]
 * @returns {{ url: string, isDirectStore: boolean, label: string }}
 */
function getInstallTarget(specificBrowser = null) {
  const browser = specificBrowser ? { name: specificBrowser } : detectBrowser();
  const storeUrl = BROWSER_STORE_URLS[browser.name] || CHROME_STORE_URL;

  if (storeUrl && storeUrl.trim() !== "") {
    return {
      url: storeUrl,
      isDirectStore: true,
      label: `Add to ${browser.label || 'Chrome'}`
    };
  }

  // Development mode fallback: Route to official install page
  return {
    url: "install.html",
    isDirectStore: false,
    label: `Get Started — Free`
  };
}

// Global scope export
if (typeof window !== 'undefined') {
  window.CHROME_STORE_URL = CHROME_STORE_URL;
  window.BROWSER_STORE_URLS = BROWSER_STORE_URLS;
  window.PRODUCT_INFO = PRODUCT_INFO;
  window.detectBrowser = detectBrowser;
  window.getInstallTarget = getInstallTarget;
}
