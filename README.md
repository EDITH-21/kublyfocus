# Knolect 🛡️

> **"Turn YouTube into your learning space."**  
> *Learn what you came for. Block what pulls you away.*

**Knolect** is a Manifest V3 Chrome Extension and learning platform designed for students, exam aspirants, developers, researchers, and lifelong learners who use YouTube for focused study without getting trapped in algorithmic distraction loops.

---

## ✨ Features

1. **Strict Focus Mode (Allowlist-First Security)**:
   - Sets YouTube to an allowlist-first access model: `DEFAULT = BLOCK`, `WHITELISTED = ALLOW`.
   - Blocks search result feeds (`/results?search_query=...`) with a clean study block screen to prevent entertainment exploration.
   - Blocks short-form video feeds (`/shorts/*`).
   - Automatically pauses non-whitelisted videos (`/watch?v=...`) and displays a dedicated Knolect Block Screen with `[Return to Learning]` and `[+ Allow & Whitelist]` options.
   - Blocks non-whitelisted channel pages during active focus sessions.

2. **Normal Focus Mode**:
   - Replaces the infinite homepage recommendation feed with the clean Knolect Home Learning Space (study quote + approved channel shortcuts).
   - Removes Shorts shelves, navigation buttons, and tab links.
   - Hides related video recommendation sidebars on watch pages.
   - Hides video comment sections and endscreen video overlays.

3. **Channel Whitelist**:
   - User-controlled allowlist for trusted educational channels (e.g. *MIT OpenCourseWare*, *3Blue1Brown*, *freeCodeCamp*, *Khan Academy*).
   - 1-click quick whitelisting directly from the popup or active watch page.
   - Whitelisted creators bypass blocking for seamless study.

4. **Session Timer**:
   - Built-in Pomodoro focus timer with 15m, 25m, 45m, and 60m presets.
   - Timestamp-based calculation (`endTime - Date.now()`) preventing clock drift.
   - Survives popup closure and persists state via background alarms.
   - Action badge indicator displays remaining minutes (e.g. `25m`) or `STRICT` / `ON`.

5. **YouTube SPA Protection**:
   - Deeply integrates with YouTube's Single Page Application lifecycle (`yt-navigate-finish`, `yt-page-data-updated`, `pushState`, `replaceState`, `popstate`, and DOM mutation observers).
   - Re-enforces focus rules on every internal navigation and browser back/forward action.

6. **100% Local Privacy**:
   - No tracking of browsing history, video titles, or search queries.
   - All focus settings, custom whitelists, and timer preferences remain strictly on the user's device.
   - Extension works 100% offline even if external networks or servers are unavailable.

7. **Backend Ecosystem & Admin Dashboard**:
   - REST API with Node.js, Express, and MongoDB data models for account management, session stats, feedback, and bug reports.
   - Role-protected Admin Dashboard for aggregated product metrics and support queues.

---

## 📁 Repository Structure

```
focenza/
├── manifest.json            # Manifest V3 extension configuration
├── popup/
│   ├── popup.html           # Modern popup UI (Focus, Whitelist, Settings)
│   ├── popup.css            # Dark/light theme design system
│   └── popup.js             # Live UI controller & state synchronizer
├── content/
│   ├── content.js           # Content script entrypoint & SPA navigation observer
│   ├── focus-mode.js        # Core Strict Focus engine & block screen overlay
│   └── content.css          # Zero-layout-shift distraction hiding rules
├── background/
│   └── service-worker.js    # Service worker (alarms, badge, message routing)
├── storage/
│   └── storage.js           # Centralized async chrome.storage.local wrapper
├── utils/
│   ├── constants.js         # Message types, storage keys, YouTube selectors
│   ├── messaging.js         # Runtime & tab message communication helpers
│   └── helpers.js           # Time formatting, channel normalization & debounce
├── backend/
│   ├── src/
│   │   ├── config/db.js     # Data store engine & MongoDB connector
│   │   ├── models/          # Schemas for Users, Settings, Whitelist, Sessions, Feedback, Bugs, Analytics
│   │   ├── middleware/      # Auth JWT, Role Check, Rate Limiter, Error Handler
│   │   ├── controllers/     # API endpoints controller logic
│   │   ├── routes/          # Express REST routes
│   │   └── app.js           # Express app instance
│   ├── server.js            # Dedicated backend server entry point
│   └── package.json         # Backend metadata
├── website/
│   ├── index.html           # Official Product Landing Page & Interactive Focus Demo
│   ├── install.html         # Installation Guide for Chrome, Edge, Brave, Opera
│   ├── support.html         # Support Center, Feedback & Bug Reporting
│   ├── admin.html           # Admin Dashboard (Protected metrics & support queues)
│   ├── css/                 # Modern dark SaaS design system
│   ├── js/                  # Interactive demo, browser detection, configuration
│   └── assets/              # SVG brand icons & browser graphics
├── server.js                # Unified local server (serves website & /api routes)
├── test_extension.js        # Automated extension test suite (33 tests)
├── test_backend.js          # Automated backend API test suite (15 tests)
├── test_website.js          # Automated website verification suite (21 tests)
└── README.md                # Project documentation
```

---

## 🚀 How to Run the Demo & Tests

### 1. Run Automated Test Suites
```bash
node test_extension.js   # Extension & Strict Focus verification (33/33 pass)
node test_backend.js     # REST API & Auth verification (15/15 pass)
node test_website.js     # Website & Assets verification (21/21 pass)
```

### 2. Start the Unified Server (Website + REST API)
```bash
node server.js
```
- Website: `http://localhost:3000`
- Install Guide: `http://localhost:3000/install`
- Support & Feedback: `http://localhost:3000/support`
- Admin Dashboard: `http://localhost:3000/admin` (Default: `admin@knolect.app` / `AdminKnolect@2026`)
- REST API Base: `http://localhost:3000/api`

### 3. Load the Extension in Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top-right corner.
3. Click **"Load unpacked"** in the top-left corner.
4. Select the project folder (`c:\Users\shiva\Desktop\focenza`).
5. Open [YouTube](https://www.youtube.com) and test Strict Focus Mode.
