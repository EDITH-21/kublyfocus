/**
 * Knolect - Focus Mode & Strict Focus Engine
 * Enforces allowlist-first access control, search blocking, video pausing,
 * and high-fidelity learning environment overlays.
 */

class KnolectFocusEngine {
  constructor() {
    this.focusMode = true;
    this.strictFocus = true;
    this.settings = {
      hideShorts: true,
      hideComments: true,
      hideRecommendations: true,
      hideHomeFeed: true,
      hideEndScreen: true,
      blockSearch: true,
      defaultTimerDuration: 1500
    };
    this.whitelist = [];
    this.currentChannel = { name: '', identifier: '', handle: '' };
    this.isCurrentWhitelisted = false;
    this.blockedOverlay = null;

    // Inspirational learning quotes
    this.quotes = [
      "\"Live as if you were to die tomorrow. Learn as if you were to live forever.\" — Mahatma Gandhi",
      "\"An investment in knowledge pays the best interest.\" — Benjamin Franklin",
      "\"The expert in anything was once a beginner.\" — Helen Hayes",
      "\"Focus is a superpower in a distracted world.\" — Cal Newport",
      "\"Small disciplines repeated with consistency every day lead to great achievements.\" — John C. Maxwell",
      "\"Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.\" — Alexander Graham Bell"
    ];
  }

  /**
   * Update internal state and re-enforce
   */
  async updateState({ focusMode, strictFocus, settings, whitelist }) {
    if (typeof focusMode === 'boolean') this.focusMode = focusMode;
    if (typeof strictFocus === 'boolean') this.strictFocus = strictFocus;
    if (settings) this.settings = { ...this.settings, ...settings };
    if (Array.isArray(whitelist)) this.whitelist = whitelist;

    await this.apply();
  }

  /**
   * Master enforcement method
   */
  async apply() {
    const targets = [document.documentElement, document.body].filter(Boolean);

    if (!this.focusMode) {
      this.revert();
      this.renderFloatingBar();
      return;
    }

    // Set attributes for CSS-driven distraction removal
    targets.forEach(el => {
      el.setAttribute('data-knolect-focus', 'true');
      el.setAttribute('data-knolect-strict', this.strictFocus ? 'true' : 'false');
      el.setAttribute('data-hide-shorts', this.settings.hideShorts ? 'true' : 'false');
      el.setAttribute('data-hide-comments', this.settings.hideComments ? 'true' : 'false');
      el.setAttribute('data-hide-recommendations', this.settings.hideRecommendations ? 'true' : 'false');
      el.setAttribute('data-hide-home-feed', this.settings.hideHomeFeed ? 'true' : 'false');
      el.setAttribute('data-hide-endscreen', this.settings.hideEndScreen ? 'true' : 'false');
    });

    // Evaluate channel whitelist
    await this.evaluateChannelWhitelist();

    // Enforce URL & Page-Specific Rules (Strict Focus Allowlist)
    this.enforcePageRules();

    // Render floating on-page widget
    this.renderFloatingBar();
  }

  /**
   * Revert all Knolect modifications
   */
  revert() {
    const targets = [document.documentElement, document.body].filter(Boolean);
    targets.forEach(el => {
      el.removeAttribute('data-knolect-focus');
      el.removeAttribute('data-knolect-strict');
      el.removeAttribute('data-hide-shorts');
      el.removeAttribute('data-hide-comments');
      el.removeAttribute('data-hide-recommendations');
      el.removeAttribute('data-hide-home-feed');
      el.removeAttribute('data-hide-endscreen');
      el.removeAttribute('data-knolect-whitelisted');
    });

    // Remove block screens & placeholders
    this.removeBlockScreen();

    const homePlaceholder = document.getElementById('knolect-home-placeholder');
    if (homePlaceholder) homePlaceholder.remove();

    const indicator = document.getElementById('knolect-whitelist-badge');
    if (indicator) indicator.remove();

    this.renderFloatingBar();
  }

  /**
   * Extract channel information from page / video player
   */
  detectCurrentChannel() {
    let name = '';
    let handle = '';
    let identifier = '';

    const pathname = window.location.pathname;

    // 1. Channel Page (e.g. /@username or /channel/UC...)
    if (pathname.startsWith('/@') || pathname.startsWith('/channel/') || pathname.startsWith('/c/')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts[0] && parts[0].startsWith('@')) {
        handle = parts[0];
        identifier = handle.toLowerCase();
        name = handle.slice(1);
      } else if (parts[0] === 'channel' && parts[1]) {
        identifier = parts[1].toLowerCase();
        name = parts[1];
      }

      const headerElem = document.querySelector('ytd-channel-name#channel-header-name, ytd-c4-tabbed-header-renderer #channel-name, #channel-header yt-formatted-string');
      if (headerElem && headerElem.textContent) {
        name = headerElem.textContent.trim();
      }
    }

    // 2. Watch Page (/watch?v=...)
    if (pathname.includes('/watch')) {
      const ownerLink = document.querySelector('#owner #channel-name a, ytd-video-owner-renderer #channel-name a, #upload-info #channel-name a, ytd-channel-name a');
      if (ownerLink) {
        name = ownerLink.textContent.trim();
        const href = ownerLink.getAttribute('href') || '';
        if (href.startsWith('/@')) {
          handle = href.split('/')[1] || href;
          identifier = handle.toLowerCase();
        } else if (href.includes('/channel/')) {
          identifier = href.split('/channel/')[1] || '';
        }
      }
    }

    if (!identifier && name) {
      identifier = name.toLowerCase().replace(/\s+/g, '');
    }

    return { name, identifier, handle };
  }

  /**
   * Evaluate if current channel is in whitelist
   */
  async evaluateChannelWhitelist() {
    this.currentChannel = this.detectCurrentChannel();
    const docEl = document.documentElement;

    if (!this.currentChannel.name && !this.currentChannel.identifier) {
      this.isCurrentWhitelisted = false;
      if (docEl) docEl.removeAttribute('data-knolect-whitelisted');
      return;
    }

    const targetName = this.currentChannel.name.toLowerCase().trim();
    const targetId = this.currentChannel.identifier.toLowerCase().trim();
    const targetHandle = (this.currentChannel.handle || '').toLowerCase().trim();

    this.isCurrentWhitelisted = this.whitelist.some(item => {
      const itemName = (item.name || '').toLowerCase().trim();
      const itemId = (item.identifier || '').toLowerCase().trim();
      const itemHandle = (item.handle || '').toLowerCase().trim();

      if (targetHandle && itemHandle && (targetHandle === itemHandle || targetHandle === itemId)) return true;
      if (targetId && (itemId === targetId || itemHandle === targetId)) return true;
      if (targetName && (itemName === targetName || itemId === targetName)) return true;
      return false;
    });

    if (this.isCurrentWhitelisted) {
      if (docEl) docEl.setAttribute('data-knolect-whitelisted', 'true');
      this.injectWhitelistIndicator();
    } else {
      if (docEl) docEl.removeAttribute('data-knolect-whitelisted');
      const badge = document.getElementById('knolect-whitelist-badge');
      if (badge) badge.remove();
    }
  }

  /**
   * Enforce Strict Focus vs Normal Focus Rules on the active page
   */
  enforcePageRules() {
    const pathname = window.location.pathname;
    const isHome = pathname === '/' || pathname === '';
    const isSearch = pathname.startsWith('/results');
    const isShorts = pathname.startsWith('/shorts');
    const isWatch = pathname.includes('/watch');
    const isChannel = pathname.startsWith('/@') || pathname.startsWith('/channel/') || pathname.startsWith('/c/');

    // 1. Home Page
    if (isHome) {
      this.removeBlockScreen();
      if (this.focusMode && this.settings.hideHomeFeed) {
        this.injectHomePlaceholder();
      }
      return;
    } else {
      const homePlaceholder = document.getElementById('knolect-home-placeholder');
      if (homePlaceholder) homePlaceholder.remove();
    }

    // 2. YouTube Search Blocking (/results?search_query=...)
    if (isSearch && this.focusMode && this.strictFocus) {
      this.pauseVideo();
      this.renderBlockScreen({
        title: "Search Disabled in Strict Focus",
        message: "Search is disabled during your active Focus Session to prevent distraction. Intentional learning begins with your approved educational channels.",
        actionText: "Return to Learning",
        actionType: "home",
        showWhitelist: true
      });
      return;
    }

    // 3. YouTube Shorts Blocking (/shorts/...)
    if (isShorts && this.focusMode) {
      this.pauseVideo();
      this.renderBlockScreen({
        title: "Shorts Blocked",
        message: "Short-form video feeds are disabled to protect your attention and study progress.",
        actionText: "Return to Learning",
        actionType: "home",
        showWhitelist: true
      });
      return;
    }

    // 4. Video Watch Page (/watch?v=...)
    if (isWatch && this.focusMode) {
      if (this.strictFocus && !this.isCurrentWhitelisted) {
        // Strict Focus: Block non-whitelisted videos
        this.pauseVideo();
        const chName = this.currentChannel.name || 'this creator';
        this.renderBlockScreen({
          title: "Stay Focused",
          message: `This video (${chName}) is not in your Whitelist. During Strict Focus, only approved learning channels are accessible.`,
          actionText: "Return to Learning",
          actionType: "home",
          allowWhitelistCurrent: true,
          currentChannel: this.currentChannel
        });
        return;
      } else {
        // Allowed (Whitelisted or Normal Focus)
        this.removeBlockScreen();
        if (this.isCurrentWhitelisted) {
          this.injectWhitelistIndicator();
        }
      }
      return;
    }

    // 5. Channel Page
    if (isChannel && this.focusMode && this.strictFocus && !this.isCurrentWhitelisted) {
      this.renderBlockScreen({
        title: "Channel Not in Whitelist",
        message: `This channel is currently blocked under Strict Focus Mode.`,
        actionText: "Return to Learning",
        actionType: "home",
        allowWhitelistCurrent: true,
        currentChannel: this.currentChannel
      });
      return;
    }

    // Other pages: Clear block screen if conditions pass
    this.removeBlockScreen();
  }

  /**
   * Pause any active HTML5 video element immediately
   */
  pauseVideo() {
    try {
      const videos = document.querySelectorAll('video');
      videos.forEach(v => {
        if (!v.paused) {
          v.pause();
        }
      });
    } catch (e) {}
  }

  /**
   * Render modern Knolect Block Screen Overlay
   */
  renderBlockScreen({ title, message, actionText, actionType, showWhitelist, allowWhitelistCurrent, currentChannel }) {
    let screen = document.getElementById('knolect-block-screen');
    if (!screen) {
      screen = document.createElement('div');
      screen.id = 'knolect-block-screen';
      screen.className = 'knolect-block-overlay';
      document.body.appendChild(screen);
    }

    // Build whitelisted channel list
    let channelsHtml = '';
    if ((showWhitelist || allowWhitelistCurrent) && this.whitelist && this.whitelist.length > 0) {
      const chips = this.whitelist.map(ch => {
        const link = ch.identifier.startsWith('@')
          ? `https://www.youtube.com/${ch.identifier}`
          : `https://www.youtube.com/@${encodeURIComponent(ch.name.replace(/\s+/g, ''))}`;
        return `<a href="${link}" class="knolect-chip-link">📚 ${ch.name}</a>`;
      }).join('');

      channelsHtml = `
        <div class="knolect-block-whitelist-box">
          <div class="knolect-block-whitelist-title">Your Approved Learning Channels</div>
          <div class="knolect-chips-grid">${chips}</div>
        </div>
      `;
    }

    let whitelistActionHtml = '';
    if (allowWhitelistCurrent && currentChannel && (currentChannel.name || currentChannel.handle)) {
      whitelistActionHtml = `
        <button type="button" class="knolect-btn-secondary" id="knolect-btn-whitelist-now">
          <span>⭐</span> Whitelist & Allow "${currentChannel.name || currentChannel.handle}"
        </button>
      `;
    }

    screen.innerHTML = `
      <div class="knolect-block-modal">
        <div class="knolect-block-badge">
          <span>🛡️</span> KNOLECT STRICT FOCUS
        </div>
        <h2 class="knolect-block-title">${title || 'Stay Focused'}</h2>
        <p class="knolect-block-desc">${message}</p>

        <div class="knolect-block-actions">
          <button type="button" class="knolect-btn-primary" id="knolect-btn-block-action">
            <span>🏠</span> ${actionText || 'Return to Learning'}
          </button>
          ${whitelistActionHtml}
        </div>

        ${channelsHtml}
      </div>
    `;

    // Attach listeners
    const mainActionBtn = screen.querySelector('#knolect-btn-block-action');
    if (mainActionBtn) {
      mainActionBtn.addEventListener('click', () => {
        window.location.href = 'https://www.youtube.com/';
      });
    }

    const whitelistBtn = screen.querySelector('#knolect-btn-whitelist-now');
    if (whitelistBtn && currentChannel) {
      whitelistBtn.addEventListener('click', async () => {
        if (typeof globalThis.addWhitelistChannel === 'function') {
          await globalThis.addWhitelistChannel(currentChannel);
        }
        if (typeof globalThis.sendRuntimeMessage === 'function') {
          await globalThis.sendRuntimeMessage({
            type: (globalThis.MESSAGE_TYPES && globalThis.MESSAGE_TYPES.ADD_WHITELIST) || 'KNOLECT_ADD_WHITELIST',
            channel: currentChannel
          });
        }
        this.removeBlockScreen();
        window.location.reload();
      });
    }
  }

  /**
   * Remove block screen if present
   */
  removeBlockScreen() {
    const screen = document.getElementById('knolect-block-screen');
    if (screen) {
      screen.remove();
    }
  }

  /**
   * Inject Home Learning Space Placeholder
   */
  injectHomePlaceholder() {
    if (document.getElementById('knolect-home-placeholder')) return;

    const targetContainer = document.querySelector('ytd-browse[page-subtype="home"] #primary, ytd-browse[page-subtype="home"], ytd-two-column-browse-results-renderer');
    if (!targetContainer) return;

    const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];

    const placeholder = document.createElement('div');
    placeholder.id = 'knolect-home-placeholder';
    placeholder.className = 'knolect-home-container';

    let channelsHtml = '';
    if (this.whitelist && this.whitelist.length > 0) {
      const chips = this.whitelist.map(ch => {
        const link = ch.identifier.startsWith('@')
          ? `https://www.youtube.com/${ch.identifier}`
          : (ch.identifier.startsWith('uc') || ch.identifier.startsWith('UC')
              ? `https://www.youtube.com/channel/${ch.identifier}`
              : `https://www.youtube.com/@${encodeURIComponent(ch.name.replace(/\s+/g, ''))}`);
        return `<a href="${link}" class="knolect-chip-link">📚 ${ch.name}</a>`;
      }).join('');

      channelsHtml = `
        <div class="knolect-channels-quick">
          <div class="knolect-channels-title">Your Whitelisted Learning Channels</div>
          <div class="knolect-chips-grid">
            ${chips}
          </div>
        </div>
      `;
    }

    placeholder.innerHTML = `
      <div class="knolect-card">
        <div class="knolect-badge-pill">
          <span>🎯</span> ${this.strictFocus ? 'Strict Focus Active' : 'Focus Mode Active'}
        </div>
        <h1 class="knolect-title">Turn YouTube into Your Learning Space</h1>
        <p class="knolect-subtitle">Learn what you came for. Block what pulls you away.</p>

        <div class="knolect-quote-box">
          ${randomQuote}
        </div>

        ${channelsHtml}
      </div>
    `;

    targetContainer.prepend(placeholder);
  }

  /**
   * Inject Whitelist Badge on Watch Page
   */
  injectWhitelistIndicator() {
    if (document.getElementById('knolect-whitelist-badge')) return;

    const titleContainer = document.querySelector('#title h1, ytd-watch-metadata #title, #above-the-fold #title');
    if (!titleContainer) return;

    const badge = document.createElement('div');
    badge.id = 'knolect-whitelist-badge';
    badge.className = 'knolect-whitelist-indicator';
    badge.innerHTML = `<span>⭐</span> Whitelisted Channel: <strong>${this.currentChannel.name || 'Learning Content'}</strong> (Unrestricted)`;

    titleContainer.parentNode.insertBefore(badge, titleContainer);
  }

  /**
   * Render or update the on-page floating status bar
   */
  renderFloatingBar() {
    let bar = document.getElementById('knolect-floating-control');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'knolect-floating-control';
      bar.className = 'knolect-floating-bar';
      document.body.appendChild(bar);
    }

    const isOn = this.focusMode;
    const isStrict = this.strictFocus;

    bar.innerHTML = `
      <div class="knolect-float-pill ${isOn ? '' : 'off'}">
        <span>${isOn ? '🎯' : '💤'}</span>
        <span>Knolect ${isOn ? (isStrict ? 'Strict' : 'ON') : 'OFF'}</span>
      </div>
      <button type="button" class="knolect-float-toggle ${isOn ? '' : 'off'}" id="knolect-btn-toggle-float">
        ${isOn ? 'Pause' : 'Activate'}
      </button>
    `;

    const toggleBtn = bar.querySelector('#knolect-btn-toggle-float');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const newState = !this.focusMode;
        if (typeof globalThis.sendRuntimeMessage === 'function') {
          await globalThis.sendRuntimeMessage({
            type: (globalThis.MESSAGE_TYPES && globalThis.MESSAGE_TYPES.TOGGLE_FOCUS_MODE) || 'KNOLECT_TOGGLE_FOCUS_MODE',
            enabled: newState
          });
        }
        await this.updateState({ focusMode: newState });
      });
    }
  }
}

// Attach to window & globalThis
if (typeof window !== 'undefined') {
  window.KnolectFocusEngine = KnolectFocusEngine;
  globalThis.KnolectFocusEngine = KnolectFocusEngine;
}
