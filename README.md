# BingeBlocker 🎯

> **"Transforming YouTube into a Productive Learning Environment"**

BingeBlocker is a complete product ecosystem designed for students, exam aspirants, researchers, and self-learners who use YouTube for focused study without getting trapped in algorithmic distraction loops.

---

## 🌟 The Product Ecosystem

The ecosystem consists of two connected products:

1. **BingeBlocker Chrome Extension (Manifest V3)**: The client-side extension that modifies YouTube DOM in real time to remove recommendations, Shorts, comments, and home feeds while keeping intentional learning accessible.
2. **BingeBlocker Official Website**: The marketing and installation entry point featuring interactive Focus Mode simulations, comprehensive browser guides, and real-time installation routing.

---

## ✨ Extension Features (MVP)

1. **Manifest V3 Architecture**:
   - Built following modern Chrome Extension standards with a background service worker.
   - Minimal secure permissions (`storage`, `alarms`, `tabs`, host permission for `*://*.youtube.com/*`).
2. **Instant Focus Mode**:
   - Replaces the infinite homepage feed with an inspiring learning hub and quick search.
   - Hides Shorts shelves, navigation buttons, and tab links.
   - Eliminates recommendation sidebars on watch pages.
   - Hides comments and video endscreen clutter.
   - Preserves core video player, controls, subtitles, search, and intentional viewing.
3. **Session Timer**:
   - Built-in Pomodoro/Focus timer (15m, 25m, 45m, 60m presets).
   - Timestamp-based calculation ensures zero clock drift.
   - Survives popup closing and persists state via background alarms.
   - Displays live session progress and extension badge countdowns (`25m`, `ON`).
4. **Channel Whitelist**:
   - Allows exemptions for trusted educational creators (e.g., *MIT OpenCourseWare*, *3Blue1Brown*, *freeCodeCamp*, *Khan Academy*).
   - One-click quick whitelist directly from the popup when on YouTube watch pages.
   - Whitelisted channels retain normal viewing and course discussions.
5. **Granular Distraction Controls**:
   - Toggle individual elements (Shorts, comments, recommendations, home feed placeholder, end screens).
6. **Robust YouTube SPA Compatibility**:
   - Handles YouTube's dynamic Single Page Application (SPA) lifecycle events (`yt-navigate-finish`, `yt-page-data-updated`, history popstate).
   - Uses zero-layout-shift attribute-driven CSS selectors with throttled DOM observers.

---

## 🌐 Official Marketing & Installation Website

Located in the [`website/`](website/) directory:

- **12 Required Product Sections**:
  1. **Navbar**: Brand logo, Navigation links, and primary `[Add to Chrome]` CTA.
  2. **Hero**: Headline *"Turn YouTube Into Your Learning Space"*, subtext, primary CTA, and side-by-side visual comparison.
  3. **Problem**: Step-by-step recommendation loop progression showing how 30 minutes get wasted.
  4. **Focus Mode Demo**: Real-time interactive YouTube simulator with a live `[Turn Focus Mode On]` toggle.
  5. **Features**: Concise, factual cards describing only implemented capabilities.
  6. **How It Works**: 3 clear steps (Install → Open YouTube → Turn On Focus Mode).
  7. **Before / After**: Side-by-side visual contrast between Default YouTube and BingeBlocker.
  8. **Browser Support**: Compatibility cards for Chrome, Edge, Brave, and Opera.
  9. **Privacy**: Factual privacy manifesto (*"Your settings stay in your browser"*).
  10. **FAQ**: Accordion answering top questions accurately.
  11. **Final Install CTA**: Large call to action pointing to the store URL.
  12. **Footer**: Brand tagline, navigation links, and copyright.
- **Dedicated Install Page** (`website/install.html`):
  - Browser-specific tabs (Chrome, Edge, Brave, Opera).
  - Development unpacked installation guide with step-by-step instructions and one-click copyable extension URLs (`chrome://extensions`, `edge://extensions`, `brave://extensions`).
- **Central Configuration** (`website/js/config.js`):
  - Single `CHROME_STORE_URL` configuration variable. When empty, CTAs route to `install.html`; when populated with the store URL, all buttons link directly to the Chrome Web Store.

---

## 📁 Repository Structure

```
focenza/
├── manifest.json              # Manifest V3 extension configuration
├── popup/
│   ├── popup.html             # Popup UI (Focus, Whitelist, Settings, Timer)
│   ├── popup.css              # Dark/light theme design system
│   └── popup.js               # Popup controller & state synchronizer
├── content/
│   ├── content.js             # Content script entrypoint & SPA navigation observer
│   ├── focus-mode.js          # Core DOM focus engine & whitelist evaluation
│   └── content.css            # Zero-layout-shift distraction hiding rules
├── background/
│   └── service-worker.js      # Service worker (alarms, badge, message routing)
├── storage/
│   └── storage.js             # Centralized async chrome.storage.local wrapper
├── utils/
│   ├── constants.js           # Message types, storage keys, YouTube selectors
│   ├── messaging.js           # Runtime & tab message communication helpers
│   └── helpers.js             # Time formatting, channel normalization & debounce
├── assets/
│   └── icons/                 # Extension icons (16x16, 48x48, 128x128 PNGs)
├── website/                   # Official Marketing & Installation Website
│   ├── index.html             # Main marketing landing page
│   ├── install.html           # Official installation guide
│   ├── css/
│   │   ├── styles.css         # Main design system & layout styles
│   │   ├── demo.css           # Interactive Focus Mode simulator styles
│   │   └── install.css        # Install page styles
│   ├── js/
│   │   ├── config.js          # Central CHROME_STORE_URL & browser detection
│   │   ├── main.js            # CTA binding, FAQ accordion & smooth scroll
│   │   ├── demo.js            # Live interactive simulator controller
│   │   └── install.js         # Install page tab controller & copy helpers
│   └── assets/                # Logos, favicons & browser SVGs
├── test_extension.js          # Extension test & verification suite
├── test_website.js            # Website test & verification suite
└── README.md                  # Comprehensive product ecosystem documentation
```

---

## 🚀 How to Install & Test

### 1. Load Extension in Google Chrome
1. Open **Google Chrome**.
2. Navigate to `chrome://extensions/`.
3. Toggle **Developer mode** ON (top right).
4. Click **Load unpacked** and select the root directory (`c:\Users\shiva\Desktop\focenza`).
5. Open [YouTube](https://www.youtube.com), click the BingeBlocker icon, and test Focus Mode!

### 2. View Official Website
Open [`website/index.html`](website/index.html) in any browser or serve locally using any static file server:
```bash
# Optional: run a local static server
npx serve website
```

---

## 🧪 Automated Testing Suites

Run the complete automated verification suites:

```bash
# Run Extension verification
node test_extension.js

# Run Website verification
node test_website.js
```
