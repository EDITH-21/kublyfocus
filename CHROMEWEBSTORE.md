# Chrome Web Store Listing — Knolect

**Last Updated:** 2026-10-01  
**Extension Name:** Knolect - Focused YouTube Learning  
**Target Category:** Productivity / Education  

---

## 1. Store Listing Metadata

- **Name (max 45 chars):** Knolect - Focused YouTube Learning
- **Summary / Short Description (max 132 chars):** Turn YouTube into your learning space. Block feeds, Shorts, non-educational searches, and distractions with Strict Focus Mode.
- **Detailed Description:**
Turn YouTube into your learning space.

YouTube is one of humanity's greatest educational libraries — but its recommendation algorithms, infinite homepage feeds, and addictive Shorts are engineered to maximize watch time rather than your learning outcomes.

Knolect empowers students, developers, exam aspirants, researchers, and lifelong learners to use YouTube with focus, intentionality, and zero distraction.

Key Features:
- 🛡️ Strict Focus Mode: An allowlist-first security model. Non-whitelisted videos and algorithmic search distractions are blocked with a clean learning prompt.
- 🎯 Normal Focus Mode: Instantly removes homepage recommendation feeds, Shorts tabs, sidebar recommendations, and comment sections.
- ⏱️ Session Timer: Built-in Pomodoro/Focus timer with 15, 25, 45, and 60-minute presets. Survives popup closing with toolbar badge updates.
- ⭐ Channel Whitelist: Whitelist trusted educational creators (like MIT OpenCourseWare, 3Blue1Brown, freeCodeCamp, Khan Academy) for unrestricted intentional study.
- ⚡ YouTube SPA Protection: Intercepts single-page app transitions and back/forward navigation so focus enforcement cannot be bypassed.
- 🔒 100% Local Privacy: No browsing history logging, no video title tracking, and no external data harvesting.

---

## 2. Permissions Justification

| Permission | Justification |
|---|---|
| `storage` | Required to save user focus preferences, custom channel whitelist, and session timer configurations locally. |
| `alarms` | Required to run precise study session timers in the background without draining system resources or depending on an open popup. |
| `tabs` | Required to detect the active YouTube channel for one-click whitelisting and broadcast focus state updates to open YouTube tabs. |
| `*://*.youtube.com/*` (host permission) | Required to apply distraction-blocking styles, pause non-whitelisted videos, and display focus overlays exclusively on YouTube pages. |

---

## 3. Privacy & Data Use Disclosures

- Single Purpose: Productivity extension to eliminate distracting elements on YouTube, enforce intentional educational viewing, and provide study session timers.
- Data Collection: Knolect does not collect, transmit, or monetize personal user data or browsing history. All user configurations remain local on the device via `chrome.storage.local`.
- Remote Code: No remote JavaScript, `eval()`, or external CDNs are used.
