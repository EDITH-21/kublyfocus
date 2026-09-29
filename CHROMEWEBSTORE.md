# Chrome Web Store Listing — BingeBlocker

**Last Updated:** 2026-09-22  
**Extension Name:** BingeBlocker - Focused YouTube Learning  
**Extension ID:** (assigned on upload)  
**Target Category:** Productivity / Education  

---

## 1. Store Listing Metadata

- **Name (max 45 chars):** BingeBlocker - Focused YouTube Learning
- **Summary / Short Description (max 132 chars):** Transform YouTube into a productive study space. Block algorithmic feeds, shorts, and recommendations for focused learning.
- **Detailed Description:**
Transform YouTube into an intentional, distraction-free learning environment.

YouTube is one of the world's greatest educational resources — but its recommendation algorithms, infinite homepage feeds, and addictive Shorts are engineered to maximize watch time rather than learning outcomes.

BingeBlocker empowers students, exam aspirants, developers, and lifelong learners to use YouTube with focus and purpose.

Key Features:
- 🎯 Focus Mode: Instantly remove homepage recommendation feeds, Shorts tabs, sidebar recommendations, and comment sections.
- ⏱️ Session Timer: Built-in Pomodoro/Focus timer with 15, 25, 45, and 60-minute presets to structure study blocks.
- ⭐ Channel Whitelist: Whitelist trusted educational channels (like MIT OpenCourseWare, 3Blue1Brown, freeCodeCamp, Khan Academy) for unrestricted study.
- ⚡ Fast & Lightweight: Zero-latency CSS attribute engine that does not slow down your browser or video playback.
- 🔒 100% Private & Local: No user data collection, no external servers, and no tracking.

---

## 2. Permissions Justification

| Permission | Justification |
|---|---|
| `storage` | Required to save user preferences, focus mode state, custom whitelisted channels, and session timer configurations locally. |
| `alarms` | Required to run precise session timers in the background without draining system resources or relying on open popups. |
| `tabs` | Required to detect the active YouTube video channel for one-click whitelisting and send focus state updates to open YouTube tabs. |
| `*://*.youtube.com/*` (host permission) | Required to apply distraction-blocking styles and elements exclusively on YouTube pages. |

---

## 3. Privacy & Data Use Disclosures

- Single Purpose: Productivity extension to remove distracting elements on YouTube and provide a focus timer.
- Data Collection: The extension does not collect, transmit, or share any personal user data. All configurations are stored locally on the user's device via `chrome.storage.local`.
- Remote Code: No remote JavaScript, `eval()`, or external CDNs are used.
