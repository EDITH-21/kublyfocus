# Chrome Web Store Listing — Knolect

> Last Updated: 2026-10-18

This document serves as the single source of truth for submitting and updating the Knolect extension in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## Store Listing

**Extension Name** [REQUIRED]
```text
Knolect - Focused YouTube Learning
```
*(34 / 75 characters — matches `extension/manifest.json`)*

**Short Description** [REQUIRED]
```text
Turn YouTube into a focused learning environment. Block algorithmic feeds, shorts, comments, and distractions.
```
*(111 / 132 characters — matches `extension/manifest.json`)*

**Detailed Description** [REQUIRED]
```text
Knolect turns YouTube into an intentional, distraction-free study space. Learn what you came for, without the algorithm pulling you down the rabbit hole.

YouTube is the world’s largest open library of lectures, tutorials, and educational series. But it was engineered for endless retention—surrounding every valuable lesson with clickbait thumbnails, algorithmic autoplay, short-form dopamine loops, and argumentative comment threads.

Knolect gives you full control over your attention:

KEY FEATURES
• Master Focus Mode: Hides home feed recommendations, recommended sidebar videos, and end-screen video tiles so you only see the content you searched for.
• Shorts Blocker: Removes the Shorts navigation tab and blocks short-form feeds to protect your deep focus.
• Comments Blocker: Hides comments and live chats so you can absorb lectures without reading distraction threads.
• Strict Focus & Learning Allowlist: Restricts playback to verified educational channels (such as Khan Academy, MIT OpenCourseWare, freeCodeCamp, CS50, CrashCourse) and channels you designate in "My Study Channels".
• Study Session Timer: Integrated Pomodoro timer (15 min, 25 min, 50 min) keeps your study intervals disciplined and structured.
• Focus Center Dashboard: Review your on-device focus analytics—total study time, sessions completed, and distractions avoided—all computed privately on your device.

HOW TO USE KNOLECT
1. Click "Add to Chrome" to install Knolect from the Chrome Web Store.
2. Pin Knolect to your browser toolbar (click the puzzle piece icon, then click the pin next to Knolect).
3. Open YouTube (youtube.com). Knolect activates automatically with your preferred focus settings.
4. Use the extension icon to toggle Focus Mode, activate Strict Focus, or whitelist a channel for "My Study".
5. Open the Options Dashboard anytime to review your focus stats and adjust your preferences.

PRIVACY FIRST & ZERO TRACKING
Knolect is built on the principle that your study habits are your own business. All settings, whitelists, and session logs are stored strictly inside your browser's local storage (chrome.storage.local). Knolect does NOT track your viewing history, does NOT sell data to third parties, and operates without any remote tracking scripts.

SUPPORT & FEEDBACK
Need assistance, want to suggest an educational channel, or have feedback?
• Help Center: https://kublyfocus.vercel.app/support
• Privacy Policy: https://kublyfocus.vercel.app/privacy
• Feedback: support@knolect.com
```

**Category** [REQUIRED]
```text
Productivity
```

**Single Purpose** [REQUIRED]
```text
Removes algorithmic distractions, feeds, comments, and shorts from YouTube to provide an intentional, focused learning environment.
```

**Primary Language** [REQUIRED]
```text
English
```

---

## Graphics & Assets

| Asset | Dimensions | Status | File Location |
|-------|-----------|--------|---------------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `extension/assets/icons/icon-128.png` |
| Small Icon | 48×48 PNG | ✅ Ready | `extension/assets/icons/icon-48.png` |
| Toolbar Icon | 16×16 PNG | ✅ Ready | `extension/assets/icons/icon-16.png` |
| Screenshot 1 (Focus Mode on YouTube) [REQUIRED] | 1280×800 PNG | ⬜ Requires manual capture in Chrome | `assets/store/screenshot-1.png` |
| Screenshot 2 (Popup Controls & Timer) [RECOMMENDED] | 1280×800 PNG | ⬜ Requires manual capture in Chrome | `assets/store/screenshot-2.png` |
| Screenshot 3 (Focus Center Dashboard) [RECOMMENDED] | 1280×800 PNG | ⬜ Requires manual capture in Chrome | `assets/store/screenshot-3.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 PNG | ⬜ Optional promotional tile | `assets/store/promo-small.png` |
| Marquee Promo Tile | 1400×560 PNG | ⬜ Optional promotional tile | `assets/store/promo-marquee.png` |

---

## Permissions Justification

Every permission declared in `manifest.json` is justified below for the Chrome Web Store review team:

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | `permissions` | Needed to store user focus preferences, distraction toggles (Shorts, comments, feeds), custom allowed study channels, and local session duration records on-device. |
| `alarms` | `permissions` | Needed to operate the study session Pomodoro timer reliably in the background service worker without keeping a continuous event loop active. |
| `tabs` | `permissions` | Needed to detect when the active tab is navigating a YouTube video page in order to display the current channel name/avatar in the popup and allow 1-click allowlisting. |
| `*://*.youtube.com/*` | `host_permissions` | Needed to inject the content script that hides distracting DOM elements (home feed, sidebar recommendations, comments, shorts) and pauses non-learning videos when Strict Focus is enabled. |

---

## Privacy & Data Use Disclosure

### Data Collection Assessment
**Does the extension collect user data?** **NO.**

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | N/A | No |
| Health info | No | No | N/A | No |
| Financial info | No | No | N/A | No |
| Authentication info | No | No | N/A | No |
| Personal communications | No | No | N/A | No |
| Location | No | No | N/A | No |
| Web history | No | No | N/A | No |
| User activity | Stored locally only | No | Local session timer and count of blocked distractions shown only on the user's on-device dashboard. | No |
| Website content | Read locally only | No | Inspects YouTube channel handles locally on the user's machine to match against educational allowlists. | No |

### Data Use Certification
- [x] Data is NOT sold to third parties.
- [x] Data is NOT used for purposes unrelated to the extension's core functionality.
- [x] Data is NOT used for creditworthiness or lending purposes.

---

## Privacy Policy & Distribution

- **Privacy Policy URL** [REQUIRED]: `https://kublyfocus.vercel.app/privacy`
- **Visibility**: Public
- **Regions**: All regions (Worldwide)

---

## Developer Account & Submission Steps

To submit this package to the Chrome Web Store:
1. Run `npm run package` to generate `dist/knolect-extension-v1.0.0.zip`.
2. Sign in to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole) using your Google Developer account (requires one-time $5 Google registration fee if not yet registered).
3. Click **"New Item"** and upload `dist/knolect-extension-v1.0.0.zip`.
4. Copy-paste the fields from this document (`Extension Name`, `Short Description`, `Detailed Description`, `Category: Productivity`).
5. Upload the required 128x128 icon from `extension/assets/icons/icon-128.png` and at least 1 screenshot (1280x800).
6. Fill in the **Privacy** tab using the Permissions Justification and Data Use table above.
7. Provide the Privacy Policy URL: `https://kublyfocus.vercel.app/privacy`.
8. Submit for review (Google typically reviews within 24–72 hours).
9. Once approved, copy your live Chrome Web Store item URL (e.g., `https://chromewebstore.google.com/detail/knolect/...`) and paste it into `CHROME_STORE_URL` in `website/js/config.js`.
